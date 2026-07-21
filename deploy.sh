#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Deploying Capricorn API..."
npm install
npm run build
pm2 restart "capricorn-api" || pm2 start dist/index.js --name "capricorn-api"
echo "Capricorn API deployed successfully!"
