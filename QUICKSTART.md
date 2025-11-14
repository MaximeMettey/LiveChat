# 🚀 Démarrage Rapide - LiveChat

Guide ultra-simple pour lancer l'application en 5 minutes !

## Prérequis

- **Node.js** (version 18 ou supérieure) - [Télécharger ici](https://nodejs.org/)
- C'est tout ! Plus besoin d'installer PostgreSQL 🎉

## Installation en 3 étapes

### 1. Installer les dépendances

```bash
npm install
```

Cette commande installe toutes les dépendances pour le backend et le frontend.

### 2. Configurer et initialiser la base de données

```bash
cd backend
cp .env.example .env
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

**Qu'est-ce que ça fait ?**
- Crée un fichier `.env` avec la configuration SQLite
- Crée la base de données SQLite locale (`dev.db`)
- Génère le client Prisma
- Initialise la DB avec 6 salons par défaut + un compte modérateur

### 3. Lancer l'application

```bash
cd ..
npm run dev
```

Et voilà ! L'application est lancée 🎉

## Accès à l'application

Ouvrez votre navigateur et allez sur :

- **Application** : http://localhost:5173
- **API** : http://localhost:3001

## Compte de test

Un compte **modérateur** est déjà créé pour tester les fonctionnalités d'admin :

- **Email** : `moderateur@livechat.app`
- **Mot de passe** : `moderateur123`

## Salons créés par défaut

L'application est initialisée avec ces salons :

- 💬 **général** - Salon de discussion générale
- 🇫🇷 **france** - Discutons de la France
- 🎮 **jeunes** - Salon pour les 18-25 ans
- 🎯 **jeux-vidéo** - Parlons gaming !
- 🎵 **musique** - Partagez vos goûts musicaux
- ⚽ **sport** - Actualités et discussions sportives

## Mode anonyme

Vous pouvez aussi tester en **mode anonyme** sans créer de compte :

1. Sur la page de login, restez sur l'onglet "Anonyme"
2. Entrez un pseudo, votre âge et votre département
3. Cliquez sur "Commencer à chatter"

## Commandes utiles

```bash
# Lancer l'application (backend + frontend)
npm run dev

# Lancer uniquement le backend
npm run dev:backend

# Lancer uniquement le frontend
npm run dev:frontend

# Voir la base de données avec Prisma Studio
cd backend && npx prisma studio

# Réinitialiser la base de données
cd backend
rm dev.db
npx prisma migrate dev --name init
npm run prisma:seed
```

## Structure des dossiers

```
LiveChat/
├── backend/           # API + WebSocket (Port 3001)
│   ├── prisma/       # Schéma et migrations DB
│   ├── src/          # Code source backend
│   └── dev.db        # Base de données SQLite
│
├── frontend/         # Application React (Port 5173)
│   └── src/          # Code source frontend
│
└── package.json      # Configuration monorepo
```

## Problèmes courants

### Le frontend ne se connecte pas au backend

Vérifiez que le backend tourne bien sur le port 3001 :
```bash
curl http://localhost:3001/health
# Devrait retourner : {"status":"ok","timestamp":"..."}
```

### Erreur "Port already in use"

Un autre processus utilise le port. Pour le trouver et le tuer :

```bash
# Trouver le processus sur le port 3001
lsof -i :3001

# Le tuer (remplacez PID par l'ID du processus)
kill -9 PID
```

### Réinitialiser complètement l'application

```bash
# Supprimer node_modules et la base de données
rm -rf node_modules backend/node_modules frontend/node_modules
rm backend/dev.db

# Réinstaller et réinitialiser
npm install
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
cd ..
npm run dev
```

## Support

Des questions ? Consultez le fichier `README.md` pour plus de détails ou créez une issue sur GitHub.

---

**Bon chat ! 💬**
