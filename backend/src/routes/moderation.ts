import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireModerator } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireModerator);

const moderationActionSchema = z.object({
  targetId: z.string(),
  action: z.enum(['warn', 'mute', 'ban', 'delete_message']),
  reason: z.string().min(5),
  duration: z.number().optional()
});

// Obtenir tous les signalements
router.get('/reports', async (req: AuthRequest, res) => {
  try {
    const { status = 'PENDING' } = req.query;

    const reports = await prisma.report.findMany({
      where: status !== 'ALL' ? { status: status as any } : {},
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        reported: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(reports);
  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'un signalement
router.patch('/reports/:reportId', async (req: AuthRequest, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status: status }
    });

    res.json(report);
  } catch (error) {
    console.error('Erreur mise à jour signalement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une action de modération
router.post('/actions', async (req: AuthRequest, res) => {
  try {
    const data = moderationActionSchema.parse(req.body);

    let expiresAt = null;
    if (data.duration) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + data.duration);
    }

    const action = await prisma.moderationAction.create({
      data: {
        moderatorId: req.user!.id,
        targetId: data.targetId,
        action: data.action,
        reason: data.reason,
        duration: data.duration,
        expiresAt: expiresAt
      }
    });

    // Si c'est un ban, mettre à jour le statut de l'utilisateur
    if (data.action === 'ban') {
      await prisma.user.update({
        where: { id: data.targetId },
        data: { status: 'OFFLINE' }
      });
    }

    res.json({ message: 'Action de modération créée', action });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur création action modération:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'historique de modération d'un utilisateur
router.get('/actions/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const actions = await prisma.moderationAction.findMany({
      where: { targetId: userId },
      include: {
        moderator: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(actions);
  } catch (error) {
    console.error('Erreur récupération historique modération:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les statistiques de modération
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [
      pendingReports,
      totalReports,
      totalActions,
      activeUsers
    ] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count(),
      prisma.moderationAction.count(),
      prisma.user.count({ where: { status: 'ONLINE' } })
    ]);

    res.json({
      pendingReports,
      totalReports,
      totalActions,
      activeUsers
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
