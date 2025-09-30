@echo off
echo =====================================
echo   Vercel All-in-One Deployment
echo =====================================
echo.

echo Step 1: Deploying to Vercel
echo -------------------------------------
cd eco-bottle-app

REM Deploy to Vercel (will combine frontend and backend)
echo Deploying full application...
vercel --prod

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo Next Steps:
echo 1. Set up MongoDB Atlas: https://mongodb.com/cloud/atlas
echo 2. Configure environment variables in Vercel Dashboard:
echo    - MONGODB_URI (from MongoDB Atlas)
echo    - JWT_SECRET (generate a secure key)
echo    - JWT_REFRESH_SECRET (generate another secure key)
echo    - NEXT_PUBLIC_API_URL = /api
echo 3. Test your deployed application
echo.
echo Important: See VERCEL_ALL_IN_ONE_DEPLOYMENT.md for detailed setup
echo.
pause