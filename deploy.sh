#!/bin/bash
set -e
cd /var/www/resourceflow

echo "⬇️  Pulling latest code..."
git pull origin main

echo "📦 Installing frontend deps..."
npm install
npm run build

echo "📦 Installing backend deps..."
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build

echo "🔄 Restarting API..."
pm2 restart resourceflow-api

echo "✅ Deployment complete!"
