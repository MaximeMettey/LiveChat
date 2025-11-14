# LiveChat - Application de Chat Anonyme

Application de chat en direct anonyme avec support web et mobile (PWA).

## Fonctionnalités

- ✅ Chat anonyme avec pseudo, âge et département
- ✅ Inscription optionnelle pour sauvegarder son profil
- ✅ Salons publics thématiques
- ✅ Messages privés
- ✅ Liste d'amis
- ✅ Avatars personnalisables
- ✅ Système de blocage
- ✅ Système de signalement
- ✅ Modération

## Stack Technique

### Backend
- Node.js + Express
- Socket.io (WebSocket pour temps réel)
- Prisma ORM
- PostgreSQL
- JWT pour l'authentification

### Frontend
- React + TypeScript
- Vite
- Socket.io-client
- React Router
- Tailwind CSS
- PWA support

## Installation

```bash
# Installer les dépendances
npm install

# Configurer la base de données
cd backend
cp .env.example .env
# Éditer .env avec vos credentials PostgreSQL
npx prisma migrate dev
npx prisma generate

# Lancer en développement
cd ..
npm run dev
```

## Variables d'environnement

Créer un fichier `.env` dans le dossier `backend` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/livechat"
JWT_SECRET="votre_secret_jwt_très_sécurisé"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

## Démarrage

```bash
# Développement (backend + frontend)
npm run dev

# Production
npm run build
npm start
```

## Structure du Projet

```
/
├── backend/          # API REST + WebSocket
├── frontend/         # Application React
├── shared/          # Types TypeScript partagés
└── package.json     # Configuration monorepo
```

## Licence

MIT
