#!/bin/bash
echo "🔧 Correction de la base de données SQLite..."

# Arrêter les processus npm si ils tournent
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true

echo "✅ Processus arrêtés"

# Nettoyer les anciens fichiers
cd backend
rm -f dev.db dev.db-journal
rm -rf node_modules/.prisma
rm -rf ../node_modules/.prisma

echo "✅ Anciens fichiers supprimés"

# Régénérer la base de données
echo "📦 Génération de la base de données..."
npx prisma migrate dev --name init --skip-seed
npx prisma generate

echo "🌱 Initialisation des données..."
npm run prisma:seed

echo "✅ Base de données prête !"
echo ""
echo "Vous pouvez maintenant lancer l'application avec:"
echo "  npm run dev"
