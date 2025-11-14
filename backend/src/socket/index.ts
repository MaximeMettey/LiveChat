import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware d'authentification
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token manquant'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.userId = decoded.userId;
      socket.username = decoded.username;

      next();
    } catch (error) {
      next(new Error('Authentification échouée'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    console.log(`✅ Utilisateur connecté: ${socket.username} (${socket.userId})`);

    // Mettre à jour le statut en ligne
    await prisma.user.update({
      where: { id: socket.userId },
      data: { status: 'ONLINE', lastSeenAt: new Date() }
    });

    // Notifier les amis que l'utilisateur est en ligne
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: socket.userId, accepted: true },
          { friendId: socket.userId, accepted: true }
        ]
      }
    });

    const friendIds = friendships.map(f =>
      f.userId === socket.userId ? f.friendId : f.userId
    );

    friendIds.forEach(friendId => {
      io.to(`user:${friendId}`).emit('friend:status', {
        userId: socket.userId,
        username: socket.username,
        status: 'ONLINE'
      });
    });

    // Rejoindre une room personnelle pour les messages privés
    socket.join(`user:${socket.userId}`);

    // Rejoindre un salon
    socket.on('room:join', async (roomId: string) => {
      try {
        // Vérifier que l'utilisateur est membre du salon
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId: roomId
            }
          }
        });

        if (!membership) {
          socket.emit('error', { message: 'Vous n\'êtes pas membre de ce salon' });
          return;
        }

        socket.join(`room:${roomId}`);

        // Notifier les autres membres
        socket.to(`room:${roomId}`).emit('room:user_joined', {
          userId: socket.userId,
          username: socket.username,
          roomId: roomId
        });

        console.log(`${socket.username} a rejoint le salon ${roomId}`);
      } catch (error) {
        console.error('Erreur rejoindre salon:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion au salon' });
      }
    });

    // Quitter un salon
    socket.on('room:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);

      socket.to(`room:${roomId}`).emit('room:user_left', {
        userId: socket.userId,
        username: socket.username,
        roomId: roomId
      });

      console.log(`${socket.username} a quitté le salon ${roomId}`);
    });

    // Envoyer un message dans un salon
    socket.on('message:send', async (data: {
      roomId: string;
      content: string;
    }) => {
      try {
        const { roomId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message vide' });
          return;
        }

        if (content.length > 2000) {
          socket.emit('error', { message: 'Message trop long' });
          return;
        }

        // Vérifier que l'utilisateur est membre du salon
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId: roomId
            }
          }
        });

        if (!membership) {
          socket.emit('error', { message: 'Vous n\'êtes pas membre de ce salon' });
          return;
        }

        // Créer le message
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.userId!,
            roomId: roomId,
            isPrivate: false
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
                role: true
              }
            }
          }
        });

        // Envoyer à tous les membres du salon
        io.to(`room:${roomId}`).emit('message:new', message);

        console.log(`Message de ${socket.username} dans ${roomId}`);
      } catch (error) {
        console.error('Erreur envoi message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Envoyer un message privé
    socket.on('message:private', async (data: {
      receiverId: string;
      content: string;
    }) => {
      try {
        const { receiverId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message vide' });
          return;
        }

        if (content.length > 2000) {
          socket.emit('error', { message: 'Message trop long' });
          return;
        }

        // Vérifier qu'il n'y a pas de blocage
        const block = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: socket.userId, blockedId: receiverId },
              { blockerId: receiverId, blockedId: socket.userId }
            ]
          }
        });

        if (block) {
          socket.emit('error', { message: 'Message bloqué' });
          return;
        }

        // Créer le message
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.userId!,
            receiverId: receiverId,
            isPrivate: true
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
                role: true
              }
            }
          }
        });

        // Envoyer à l'expéditeur et au destinataire
        socket.emit('message:private_new', message);
        io.to(`user:${receiverId}`).emit('message:private_new', message);

        console.log(`Message privé de ${socket.username} à ${receiverId}`);
      } catch (error) {
        console.error('Erreur envoi message privé:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Utilisateur en train d'écrire
    socket.on('typing:start', (data: { roomId?: string; receiverId?: string }) => {
      if (data.roomId) {
        socket.to(`room:${data.roomId}`).emit('typing:start', {
          userId: socket.userId,
          username: socket.username,
          roomId: data.roomId
        });
      } else if (data.receiverId) {
        io.to(`user:${data.receiverId}`).emit('typing:start', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    socket.on('typing:stop', (data: { roomId?: string; receiverId?: string }) => {
      if (data.roomId) {
        socket.to(`room:${data.roomId}`).emit('typing:stop', {
          userId: socket.userId,
          roomId: data.roomId
        });
      } else if (data.receiverId) {
        io.to(`user:${data.receiverId}`).emit('typing:stop', {
          userId: socket.userId
        });
      }
    });

    // Demande d'ami envoyée
    socket.on('friend:request', (data: { targetId: string }) => {
      io.to(`user:${data.targetId}`).emit('friend:request_received', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // Déconnexion
    socket.on('disconnect', async () => {
      console.log(`❌ Utilisateur déconnecté: ${socket.username}`);

      // Mettre à jour le statut hors ligne
      await prisma.user.update({
        where: { id: socket.userId },
        data: { status: 'OFFLINE', lastSeenAt: new Date() }
      });

      // Notifier les amis
      friendIds.forEach(friendId => {
        io.to(`user:${friendId}`).emit('friend:status', {
          userId: socket.userId,
          username: socket.username,
          status: 'OFFLINE'
        });
      });
    });
  });

  console.log('✅ Gestionnaires Socket.IO configurés');
};
