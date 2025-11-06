#!/bin/bash

# 🚀 Quick Deployment Script for Web-Based VPS Terminal
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
echo -e "${YELLOW}Checking environment files...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${RED}Error: server/.env not found!${NC}"
    echo "Create it from server/.env.example and configure your domain"
    exit 1
fi

if [ ! -f "client/.env.production" ]; then
    echo -e "${RED}Error: client/.env.production not found!${NC}"
    echo "Create it from client/.env.example and configure your domain"
    exit 1
fi

# Build Backend
echo -e "${YELLOW}Building backend...${NC}"
cd server
npm install --production=false
npm run build
echo -e "${GREEN}✅ Backend built successfully${NC}"

# Build Frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd ../client
npm install
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Deploy Backend with PM2
echo -e "${YELLOW}Deploying backend with PM2...${NC}"
cd ../server

# Stop existing process if running
pm2 stop vps-terminal-server 2>/dev/null || true

# Start new process
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}✅ Backend deployed successfully${NC}"

# Show status
echo -e "${YELLOW}Checking deployment status...${NC}"
pm2 status
pm2 logs vps-terminal-server --lines 10 --nostream

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: Built files in client/dist/"
echo ""
echo "Next steps:"
echo "1. Configure Nginx (see nginx.conf.example)"
echo "2. Setup SSL with certbot"
echo "3. Point your domain to this server"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
