@echo off
echo =====================================
echo   Vercel Deployment Process
echo =====================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    npm i -g vercel
)

echo Step 1: Deploying Frontend to Vercel
echo -------------------------------------
cd frontend

REM Check if already linked to Vercel
if not exist ".vercel" (
    echo Linking to Vercel project...
    vercel link
)

REM Deploy to Vercel
echo Deploying frontend...
vercel --prod

echo.
echo Frontend deployed successfully!
cd ..

echo.
echo Step 2: Backend Deployment Options
echo -----------------------------------
echo Choose your backend deployment strategy:
echo 1) Deploy to Vercel as serverless functions
echo 2) Deploy to Heroku
echo 3) Deploy to Railway
echo 4) Deploy to Render
echo 5) Keep using Docker locally
echo.

set /p choice="Enter your choice (1-5): "

if %choice%==1 (
    echo Deploying backend to Vercel...
    cd backend
    vercel --prod
    cd ..
) else if %choice%==2 (
    echo.
    echo Heroku deployment - Run these commands:
    echo   cd backend
    echo   heroku create your-app-name
    echo   git push heroku main
) else if %choice%==3 (
    echo.
    echo Railway deployment - Run these commands:
    echo   cd backend
    echo   railway init
    echo   railway up
) else if %choice%==4 (
    echo.
    echo Render deployment:
    echo Visit https://render.com and create a new Web Service
) else if %choice%==5 (
    echo Keeping local Docker setup
)

echo.
echo ====================================
echo   Deployment Process Complete!
echo ====================================
echo.
echo Next Steps:
echo 1. Set up MongoDB Atlas: https://mongodb.com/cloud/atlas
echo 2. Set up Redis (Upstash): https://upstash.com
echo 3. Configure environment variables in Vercel Dashboard
echo 4. Update NEXT_PUBLIC_API_URL in frontend
echo 5. Test your deployed application
echo.
echo Important URLs:
echo - Vercel Dashboard: https://vercel.com/dashboard
echo - Your Frontend: Check Vercel dashboard for URL
echo - Documentation: See VERCEL_DEPLOYMENT.md
echo.
pause