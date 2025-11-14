import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireModerator } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

const createRoomSchema = z.object({
  name: z.string().min(3).max(30),
  description: z.string().max(200).optional(),
  isPrivate: z.boolean().default(false),
  maxUsers: z.number().min(2).max(500).default(100)
});

// Obtenir tous les salons publics
router.get('/', async (req: AuthRequest, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isPrivate: false },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Erreur récupération salons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un salon (réservé aux modérateurs)
router.post('/', requireModerator, async (req: AuthRequest, res) => {
  try {
    const data = createRoomSchema.parse(req.body);

    const room = await prisma.room.create({
      data: data
    });

    res.json(room);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Un salon avec ce nom existe déjà' });
    }
    console.error('Erreur création salon:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un salon spécifique
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Salon non trouvé' });
    }

    res.json(room);
  } catch (error) {
    console.error('Erreur récupération salon:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rejoindre un salon
router.post('/:id/join', async (req: AuthRequest, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user!.id;

    // Vérifier que le salon existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: { select: { members: true } }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Salon non trouvé' });
    }

    // Vérifier si le salon n'est pas plein
    if (room._count.members >= room.maxUsers) {
      return res.status(400).json({ error: 'Le salon est plein' });
    }

    // Ajouter l'utilisateur au salon
    const member = await prisma.roomMember.create({
      data: {
        userId: userId,
        roomId: roomId
      }
    });

    res.json({ message: 'Vous avez rejoint le salon', member });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Vous êtes déjà dans ce salon' });
    }
    console.error('Erreur rejoindre salon:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Quitter un salon
router.post('/:id/leave', async (req: AuthRequest, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user!.id;

    await prisma.roomMember.delete({
      where: {
        userId_roomId: {
          userId: userId,
          roomId: roomId
        }
      }
    });

    res.json({ message: 'Vous avez quitté le salon' });
  } catch (error) {
    console.error('Erreur quitter salon:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les salons d'un utilisateur
router.get('/user/me', async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.roomMember.findMany({
      where: { userId: req.user!.id },
      include: {
        room: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });

    const rooms = memberships.map(m => m.room);
    res.json(rooms);
  } catch (error) {
    console.error('Erreur récupération salons utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
