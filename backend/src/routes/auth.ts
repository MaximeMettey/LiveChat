import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schémas de validation
const anonymousLoginSchema = z.object({
  username: z.string().min(3).max(20),
  age: z.number().min(13).max(99),
  department: z.string().length(2).or(z.string().length(3)) // Ex: "75", "2A"
});

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().min(13).max(99),
  department: z.string().length(2).or(z.string().length(3))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Connexion anonyme (sans compte)
router.post('/anonymous', async (req, res) => {
  try {
    const data = anonymousLoginSchema.parse(req.body);

    // Vérifier si le username existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Ce pseudo est déjà pris' });
    }

    // Créer un utilisateur anonyme
    const user = await prisma.user.create({
      data: {
        username: data.username,
        age: data.age,
        department: data.department,
        isAnonymous: true,
        status: 'ONLINE'
      }
    });

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        age: user.age,
        department: user.department,
        avatar: user.avatar,
        role: user.role,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur connexion anonyme:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Inscription avec compte
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Vérifier si l'email ou le username existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === data.email
          ? 'Cet email est déjà utilisé'
          : 'Ce pseudo est déjà pris'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        age: data.age,
        department: data.department,
        isAnonymous: false,
        status: 'ONLINE'
      }
    });

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        department: user.department,
        avatar: user.avatar,
        role: user.role,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion avec compte
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour le statut
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE', lastSeenAt: new Date() }
    });

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        department: user.department,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
