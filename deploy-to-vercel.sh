#!/bin/bash

echo "🚀 Starting Vercel Deployment Process..."
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

echo -e "${BLUE}Step 1: Deploying Frontend to Vercel${NC}"
echo "-------------------------------------"
cd frontend

# Check if already linked to Vercel
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Linking to Vercel project...${NC}"
    vercel link
fi

# Deploy to Vercel
echo -e "${GREEN}Deploying frontend...${NC}"
vercel --prod

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"

cd ..

echo ""
echo -e "${BLUE}Step 2: Backend Deployment Options${NC}"
echo "-----------------------------------"
echo "Choose your backend deployment strategy:"
echo "1) Deploy to Vercel as serverless functions"
echo "2) Deploy to Heroku"
echo "3) Deploy to Railway"
echo "4) Deploy to Render"
echo "5) Keep using Docker locally"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}Deploying backend to Vercel...${NC}"
        cd backend
        vercel --prod
        cd ..
        ;;
    2)
        echo -e "${YELLOW}Heroku deployment:${NC}"
        echo "Run these commands:"
        echo "  cd backend"
        echo "  heroku create your-app-name"
        echo "  git push heroku main"
        ;;
    3)
        echo -e "${YELLOW}Railway deployment:${NC}"
        echo "Run these commands:"
        echo "  cd backend"
        echo "  railway init"
        echo "  railway up"
        ;;
    4)
        echo -e "${YELLOW}Render deployment:${NC}"
        echo "Visit https://render.com and create a new Web Service"
        ;;
    5)
        echo -e "${BLUE}Keeping local Docker setup${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}🎉 Deployment Process Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Set up MongoDB Atlas: https://mongodb.com/cloud/atlas"
echo "2. Set up Redis (Upstash): https://upstash.com"
echo "3. Configure environment variables in Vercel Dashboard"
echo "4. Update NEXT_PUBLIC_API_URL in frontend"
echo "5. Test your deployed application"
echo ""
echo -e "${YELLOW}Important URLs:${NC}"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Your Frontend: Check Vercel dashboard for URL"
echo "- Documentation: See VERCEL_DEPLOYMENT.md"