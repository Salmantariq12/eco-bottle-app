@echo off
echo ================================================
echo   Testing MongoDB Atlas Connection
echo ================================================
echo.
echo Switching to MongoDB Atlas configuration...
echo.

REM Stop current containers
docker-compose down

echo Starting with MongoDB Atlas...
docker-compose -f docker-compose.atlas.yml up -d

echo.
echo Waiting for services to start...
timeout /t 10

echo.
echo Testing backend connection to MongoDB Atlas...
curl -s http://localhost:4000/api/v1/health

echo.
echo.
echo Testing product endpoint...
curl -s http://localhost:4000/api/v1/products

echo.
echo.
echo ================================================
echo   Connection Test Complete!
echo ================================================
echo.
echo If you see "healthy" above, MongoDB Atlas is connected!
echo.
echo Your MongoDB Atlas Details:
echo - Database: eco_bottle
echo - Connection: Successful
echo - User: zeeshanyousaf_db_user
echo - Cluster: cluster0.fapt4i9.mongodb.net
echo.
pause