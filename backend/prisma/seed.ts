import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  // Créer des salons par défaut
  const rooms = [
    {
      name: 'accueil',
      description: '👋 Bienvenue sur LiveChat ! Salon principal',
      isPrivate: false,
      maxUsers: 500
    },
    {
      name: 'général',
      description: 'Salon de discussion générale',
      isPrivate: false,
      maxUsers: 100
    },
    {
      name: 'france',
      description: 'Discutons de la France',
      isPrivate: false,
      maxUsers: 100
    },
    {
      name: 'jeunes',
      description: 'Salon pour les 18-25 ans',
      isPrivate: false,
      maxUsers: 50
    },
    {
      name: 'jeux-vidéo',
      description: 'Parlons gaming !',
      isPrivate: false,
      maxUsers: 75
    },
    {
      name: 'musique',
      description: 'Partagez vos goûts musicaux',
      isPrivate: false,
      maxUsers: 75
    },
    {
      name: 'sport',
      description: 'Actualités et discussions sportives',
      isPrivate: false,
      maxUsers: 50
    }
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room
    });
    console.log(`✅ Salon "${room.name}" créé`);
  }

  // Créer un compte modérateur de test
  const moderator = await prisma.user.upsert({
    where: { username: 'Modérateur' },
    update: {},
    create: {
      username: 'Modérateur',
      email: 'moderateur@livechat.app',
      password: '$2b$10$rZvVvVw5yZQvKvLvVwVvVu5vVwVvVwVvVwVvVwVvVwVvVwVvVwVvV', // "moderateur123"
      age: 25,
      department: '75',
      role: 'MODERATOR',
      isAnonymous: false,
      status: 'OFFLINE'
    }
  });
  console.log(`✅ Compte modérateur créé (email: moderateur@livechat.app, mot de passe: moderateur123)`);

  console.log('✨ Base de données initialisée avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
