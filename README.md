# Eco-Friendly Water Bottle E-Commerce Platform

A production-ready, scalable e-commerce platform for eco-friendly water bottles built with Next.js, Node.js, MongoDB, Redis, and Docker.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd eco-bottle-app

# Start all services with Docker Compose
docker-compose up --build

# Application will be available at:
# - Frontend: http://localhost:3000
# - API: http://localhost/api/v1
# - Metrics: http://localhost:9090
```

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    NGINX    │────▶│  Frontend   │
└─────────────┘     │   (Proxy/   │     │  (Next.js)  │
                    │   LB :80)   │     └─────────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Backend    │
                    │  (Express)   │
                    │    :4000     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼──┐ ┌───────▼───────┐
       │   MongoDB   │ │Redis│ │  Prometheus   │
       │   :27017    │ │:6379│ │    :9090      │
       └─────────────┘ └─────┘ └───────────────┘
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Backend**: Node.js 18, Express, MongoDB, Redis
- **Authentication**: JWT (Access + Refresh tokens)
- **Caching**: Redis with ETag support
- **Rate Limiting**: Redis-backed distributed rate limiting
- **Monitoring**: Prometheus metrics
- **Load Balancing**: NGINX
- **Container**: Docker & Docker Compose
- **Testing**: Artillery for stress testing

## 📦 Features

- ✅ Server-Side Rendering (SSR) with Next.js
- ✅ Parallax hero section with scroll animations
- ✅ A/B testing for headlines (?headline=variantA|variantB)
- ✅ Real-time form validation
- ✅ JWT authentication with refresh tokens
- ✅ Redis caching with cache invalidation
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Prometheus metrics integration
- ✅ Horizontal scaling support
- ✅ NGINX load balancing
- ✅ Mobile-responsive design
- ✅ Framer Motion animations

## 🚀 Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (if running locally)
- Redis (if running locally)

### Local Development Setup

#### Backend
```bash
cd backend
npm install
cp ../.env.example .env
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 npm run dev
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Scale backend replicas
docker-compose up --scale backend=3 --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile (protected)

### Products
- `GET /api/v1/products` - List products (paginated, cached)
- `GET /api/v1/products/:id` - Get product details (cached)
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)
- `POST /api/v1/products/seed` - Seed sample products (admin)

### Leads/Orders
- `POST /api/v1/leads` - Create order/lead
- `GET /api/v1/leads` - List leads (admin)
- `GET /api/v1/leads/:id` - Get lead details
- `PATCH /api/v1/leads/:id/status` - Update lead status (admin)
- `GET /api/v1/leads/stats` - Get statistics (admin)

### Monitoring
- `GET /api/v1/health` - Health check
- `GET /metrics` - Prometheus metrics

## 🧪 Testing

### Running Stress Tests

```bash
# Install Artillery globally
npm install -g artillery

# Run stress test
cd artillery
artillery run stress-test.yml --output reports/report.json

# Generate HTML report
artillery report reports/report.json --output reports/report.html
```

### Test Scenarios
- Browse Products (40% weight)
- Quick Checkout (30% weight)
- User Registration/Login (20% weight)
- Heavy Load Test (10% weight)

### Pass Criteria
- Median latency < 200ms
- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 1%

## 📊 Monitoring

### Prometheus Metrics
Access Prometheus at `http://localhost:9090`

Available metrics:
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total requests counter
- `in_flight_requests` - Current requests gauge
- `db_operation_duration_seconds` - Database operation duration
- `cache_hits_total` / `cache_misses_total` - Cache statistics
- `rate_limit_exceeded_total` - Rate limit violations

### Example Queries
```promql
# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Requests per second
rate(http_requests_total[1m])

# Cache hit ratio
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
```

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `MONGO_URI` - MongoDB connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis configuration
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT secrets (CHANGE IN PRODUCTION!)
- `NEXT_PUBLIC_API_URL` - API URL for frontend
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` - Rate limiting config

## 📝 Sample cURL Commands

```bash
# Register user
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get products
curl http://localhost/api/v1/products?limit=10&page=1

# Create lead/order
curl -X POST http://localhost/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jane Doe",
    "email":"jane@example.com",
    "productId":"PRODUCT_ID_HERE",
    "quantity":2,
    "address":{
      "street":"123 Main St",
      "city":"New York",
      "state":"NY",
      "zipCode":"10001"
    }
  }'

# Health check
curl http://localhost/api/v1/health

# Metrics
curl http://localhost/metrics
```

## 🚀 Deployment

### Vercel (Frontend)
1. Fork this repository
2. Connect to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = Your backend URL

### Heroku/Render (Backend)
1. Create new app
2. Connect GitHub repository
3. Set environment variables from `.env.example`
4. Add MongoDB and Redis add-ons
5. Deploy

### Production Checklist
- [ ] Change JWT secrets
- [ ] Configure MongoDB replica set
- [ ] Setup Redis persistence
- [ ] Configure SSL certificates
- [ ] Setup CDN for static assets
- [ ] Configure backup strategy
- [ ] Setup monitoring alerts
- [ ] Configure log aggregation
- [ ] Setup CI/CD pipeline
- [ ] Load test with production-like data

## 🎯 A/B Testing

The application supports A/B testing for headlines:
- Access variant A: `http://localhost/?headline=variantA`
- Access variant B: `http://localhost/?headline=variantB`
- The selection is stored in cookies for returning users

## 📈 Scaling to 100k+ Users

See [PRODUCTION_NOTES.md](PRODUCTION_NOTES.md) for detailed scaling strategies.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**MongoDB connection failed**
- Ensure MongoDB is running: `docker-compose ps mongo`
- Check connection string in environment variables

**Redis connection failed**
- Ensure Redis is running: `docker-compose ps redis`
- Check Redis host/port configuration

**Frontend can't connect to backend**
- Check NEXT_PUBLIC_API_URL environment variable
- Ensure NGINX is properly configured
- Check CORS settings in backend

**Rate limiting too strict**
- Adjust RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX
- Check Redis connection for distributed rate limiting

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.