#!/bin/bash
set -e  # stop if any command fails

echo "🧹 Cleaning node modules..."
rm -rf node_modules package-lock.json

echo "🧼 Cleaning npm cache..."
npm cache clean --force

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building app..."
npm run build

echo "🚀 Deploying build to nginx..."
sudo cp -rf dist/* /var/www/react-app/current/

echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
