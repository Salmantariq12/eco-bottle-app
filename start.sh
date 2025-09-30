#!/bin/bash

echo "Starting Eco-Friendly Water Bottle Application..."
echo "================================================"
echo ""
echo "This will start all services using Docker Compose"
echo ""
echo "Services that will be started:"
echo "- Frontend (Next.js): http://localhost:3000"
echo "- Backend API: http://localhost:4000/api/v1"
echo "- NGINX Proxy: http://localhost"
echo "- MongoDB: localhost:27017"
echo "- Redis: localhost:6379"
echo "- Prometheus: http://localhost:9090"
echo ""
echo "Press Enter to start or Ctrl+C to cancel..."
read

echo ""
echo "Building and starting services..."
docker-compose up --build

echo ""
echo "Services stopped."