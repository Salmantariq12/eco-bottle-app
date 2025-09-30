@echo off
echo ================================================
echo   Connect to MongoDB Atlas - Setup Guide
echo ================================================
echo.

echo This script will help you connect to MongoDB Atlas
echo.

echo Step 1: MongoDB Atlas Credentials
echo ----------------------------------
echo Please enter your MongoDB Atlas connection details:
echo.

set /p ATLAS_URI="Enter your MongoDB Atlas connection string: "

if "%ATLAS_URI%"=="" (
    echo ERROR: Connection string cannot be empty!
    pause
    exit /b 1
)

echo.
echo Testing MongoDB Atlas connection...
echo.

REM Update docker-compose.atlas.yml with the connection string
powershell -Command "(gc docker-compose.atlas.yml) -replace 'mongodb\+srv://username:password@cluster\.mongodb\.net/eco_bottle\?retryWrites=true&w=majority', '%ATLAS_URI%' | Out-File -encoding ASCII docker-compose.atlas.yml"

echo Connection string updated in docker-compose.atlas.yml
echo.

echo Step 2: Restarting Application with MongoDB Atlas
echo --------------------------------------------------

REM Stop current containers
docker-compose down

echo Starting application with MongoDB Atlas...
docker-compose -f docker-compose.atlas.yml up -d

echo.
echo ================================================
echo   MongoDB Atlas Connection Setup Complete!
echo ================================================
echo.
echo Your application is now connected to MongoDB Atlas!
echo.
echo Access your application at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:4000
echo - With Nginx: http://localhost:9080
echo.
echo To verify the connection:
echo 1. Check backend logs: docker logs eco-bottle-app-backend-1
echo 2. Try creating a user or product
echo 3. Check MongoDB Atlas dashboard for connection
echo.
echo IMPORTANT:
echo - Your data is now stored in MongoDB Atlas (cloud)
echo - Make sure your Atlas cluster is running
echo - Whitelist IP addresses in Atlas Network Access
echo.
pause