import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Tous les endpoints nécessitent l'authentification
router.use(authenticateToken);

// Schémas de validation
const updateProfileSchema = z.object({
  bio: z.string().max(200).optional(),
  age: z.number().min(13).max(99).optional(),
  department: z.string().length(2).or(z.string().length(3)).optional()
});

// Obtenir son profil
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        department: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        isAnonymous: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour son profil
router.patch('/me', async (req: AuthRequest, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: data,
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        department: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        isAnonymous: true
      }
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload avatar
router.post('/me/avatar', upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        username: true,
        avatar: true
      }
    });

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un utilisateur par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        age: true,
        department: true,
        avatar: true,
        bio: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rechercher des utilisateurs
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, department } = req.query;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search ? {
            username: {
              contains: search as string,
              mode: 'insensitive'
            }
          } : {},
          department ? { department: department as string } : {}
        ]
      },
      select: {
        id: true,
        username: true,
        age: true,
        department: true,
        avatar: true,
        status: true
      },
      take: 50
    });

    res.json(users);
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Bloquer un utilisateur
router.post('/:id/block', async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous bloquer vous-même' });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Créer le blocage
    const block = await prisma.block.create({
      data: {
        blockerId: req.user!.id,
        blockedId: targetId
      }
    });

    res.json({ message: 'Utilisateur bloqué', block });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Utilisateur déjà bloqué' });
    }
    console.error('Erreur blocage utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Débloquer un utilisateur
router.delete('/:id/block', async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id;

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: req.user!.id,
          blockedId: targetId
        }
      }
    });

    res.json({ message: 'Utilisateur débloqué' });
  } catch (error) {
    console.error('Erreur déblocage utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir la liste des utilisateurs bloqués
router.get('/me/blocks', async (req: AuthRequest, res) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.user!.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json(blocks);
  } catch (error) {
    console.error('Erreur récupération blocages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Signaler un utilisateur
router.post('/:id/report', async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id;
    const { reason, description } = req.body;

    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Créer le signalement
    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.id,
        reportedId: targetId,
        reason: reason,
        description: description
      }
    });

    res.json({ message: 'Signalement envoyé', report });
  } catch (error) {
    console.error('Erreur signalement utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
