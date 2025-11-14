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
- **SQLite** (aucune installation requise !)
- JWT pour l'authentification

### Frontend
- React + TypeScript
- Vite
- Socket.io-client
- React Router
- Tailwind CSS
- PWA support

## Installation Rapide

```bash
# Installer les dépendances
npm install

# Configurer la base de données
cd backend
cp .env.example .env

# Créer la base de données SQLite et les migrations
npx prisma migrate dev --name init
npx prisma generate

# Initialiser avec des données de test (salons et compte modérateur)
npm run prisma:seed

# Lancer en développement
cd ..
npm run dev
```

C'est tout ! SQLite est intégré, aucune installation de base de données nécessaire. 🎉

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:3001

**Compte modérateur de test :**
- Email : `moderateur@livechat.app`
- Mot de passe : `moderateur123`

## Variables d'environnement

Le fichier `.env` dans le dossier `backend` est déjà configuré pour SQLite :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="changez_ce_secret_en_production_avec_une_valeur_tres_securisee"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

> **Note** : Pour la production, vous pouvez facilement passer à PostgreSQL ou MySQL en changeant juste le `provider` dans `prisma/schema.prisma`.

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
