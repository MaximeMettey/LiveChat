import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Obtenir la liste d'amis
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId, accepted: true },
          { friendId: userId, accepted: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            department: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            department: true
          }
        }
      }
    });

    // Formater pour retourner l'ami (pas soi-même)
    const friends = friendships.map(f => {
      const friend = f.userId === userId ? f.friend : f.user;
      return {
        friendshipId: f.id,
        ...friend
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Erreur récupération amis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les demandes d'amis en attente
router.get('/requests', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        accepted: false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            department: true
          }
        }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer une demande d'ami
router.post('/:userId', async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.userId;
    const userId = req.user!.id;

    if (targetId === userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier qu'il n'y a pas de blocage
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetId },
          { blockerId: targetId, blockedId: userId }
        ]
      }
    });

    if (block) {
      return res.status(403).json({ error: 'Impossible d\'ajouter cet utilisateur' });
    }

    // Vérifier qu'il n'y a pas déjà une demande
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetId },
          { userId: targetId, friendId: userId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Une demande existe déjà' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId: userId,
        friendId: targetId,
        accepted: false
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json({ message: 'Demande d\'ami envoyée', friendship });
  } catch (error) {
    console.error('Erreur envoi demande ami:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Accepter une demande d'ami
router.post('/:friendshipId/accept', async (req: AuthRequest, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user!.id;

    // Vérifier que la demande existe et est pour l'utilisateur
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (friendship.friendId !== userId) {
      return res.status(403).json({ error: 'Cette demande ne vous est pas destinée' });
    }

    if (friendship.accepted) {
      return res.status(400).json({ error: 'Demande déjà acceptée' });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { accepted: true }
    });

    res.json({ message: 'Demande acceptée', friendship: updated });
  } catch (error) {
    console.error('Erreur acceptation demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Refuser/supprimer une amitié
router.delete('/:friendshipId', async (req: AuthRequest, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user!.id;

    // Vérifier que la demande existe et concerne l'utilisateur
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Amitié non trouvée' });
    }

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer cette amitié' });
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    res.json({ message: 'Amitié supprimée' });
  } catch (error) {
    console.error('Erreur suppression amitié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
