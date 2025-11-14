import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Obtenir les messages d'un salon
router.get('/room/:roomId', async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    // Vérifier que l'utilisateur est membre du salon
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: req.user!.id,
          roomId: roomId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Vous n\'êtes pas membre de ce salon' });
    }

    // Obtenir les utilisateurs bloqués
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user!.id },
      select: { blockedId: true }
    });
    const blockedIds = blocks.map(b => b.blockedId);

    const messages = await prisma.message.findMany({
      where: {
        roomId: roomId,
        deletedAt: null,
        senderId: {
          notIn: blockedIds
        },
        ...(before ? {
          createdAt: {
            lt: new Date(before as string)
          }
        } : {})
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
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les conversations privées
router.get('/private/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Obtenir les utilisateurs bloqués
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    });
    const blockedIds = blocks.map(b => b.blockedId);

    // Récupérer tous les messages privés de l'utilisateur
    const messages = await prisma.message.findMany({
      where: {
        isPrivate: true,
        deletedAt: null,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        AND: [
          { senderId: { notIn: blockedIds } },
          { receiverId: { notIn: blockedIds } }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Grouper par conversation (autre utilisateur) et garder seulement le dernier message
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUserId = message.senderId === userId ? message.receiverId! : message.senderId;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          createdAt: message.createdAt,
          otherUserId: otherUserId
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Enrichir avec les infos utilisateur
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await prisma.user.findUnique({
          where: { id: conv.otherUserId },
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true
          }
        });

        return {
          ...conv,
          otherUser
        };
      })
    );

    res.json(enrichedConversations);
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les messages privés avec un utilisateur
router.get('/private/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user!.id;

    // Vérifier que l'autre utilisateur n'est pas bloqué
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId }
        ]
      }
    });

    if (block) {
      return res.status(403).json({ error: 'Conversation bloquée' });
    }

    const messages = await prisma.message.findMany({
      where: {
        isPrivate: true,
        deletedAt: null,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ],
        ...(before ? {
          createdAt: {
            lt: new Date(before as string)
          }
        } : {})
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
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Erreur récupération messages privés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un message (soft delete)
router.delete('/:messageId', async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Vérifier que le message appartient à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (message.senderId !== userId && req.user!.role !== 'MODERATOR' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer ce message' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
