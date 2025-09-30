@echo off
echo ====================================================
echo   Vercel All-in-One Deployment Script
echo   Deploy Frontend + Backend API to Vercel
echo ====================================================
echo.

REM Check if in frontend directory
cd frontend 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Please run this script from the eco-bottle-app directory
    pause
    exit /b 1
)

echo Step 1: Installing Dependencies
echo --------------------------------
echo Installing required packages...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building Application
echo ----------------------------
echo Building Next.js application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed. Please check for errors above.
    pause
    exit /b 1
)

echo.
echo Step 3: Vercel CLI Check
echo ------------------------
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    call npm i -g vercel
)

echo.
echo Step 4: MongoDB Atlas Setup
echo ---------------------------
echo.
echo IMPORTANT: Before continuing, ensure you have:
echo 1. Created a MongoDB Atlas account
echo 2. Created a free M0 cluster
echo 3. Added a database user
echo 4. Whitelisted IP (0.0.0.0/0)
echo 5. Copied your connection string
echo.
pause

echo.
echo Step 5: Environment Variables
echo -----------------------------
echo You will need to add these in Vercel Dashboard:
echo.
echo MONGODB_URI = your-mongodb-atlas-connection-string
echo JWT_SECRET = your-secret-key-minimum-32-chars
echo JWT_REFRESH_SECRET = your-refresh-secret-minimum-32-chars
echo NEXT_PUBLIC_API_URL = /api
echo.
echo Press any key when ready to deploy...
pause >nul

echo.
echo Step 6: Deploying to Vercel
echo ---------------------------
echo Running Vercel deployment...
echo.

REM Deploy to Vercel
vercel --prod

echo.
echo ====================================================
echo   Deployment Process Complete!
echo ====================================================
echo.
echo NEXT STEPS:
echo -----------
echo 1. Go to your Vercel Dashboard
echo 2. Add environment variables (Settings -> Environment Variables)
echo 3. Redeploy if needed (Deployments -> Redeploy)
echo 4. Test your application:
echo    - Homepage: https://your-app.vercel.app
echo    - Login: https://your-app.vercel.app/login
echo    - Register: https://your-app.vercel.app/register
echo.
echo 5. Create initial data:
echo    - Register an admin user
echo    - Add products via MongoDB Atlas dashboard
echo.
echo Documentation: VERCEL_ALL_IN_ONE_DEPLOYMENT.md
echo.
pause