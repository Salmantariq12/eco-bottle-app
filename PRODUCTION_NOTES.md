# Production Scaling Notes - Handling 100k+ Users

## Current Architecture Limitations & Bottlenecks

### Identified Bottlenecks (from stress testing)
1. **Database connections**: MongoDB connection pool exhaustion at ~500 concurrent users
2. **Memory usage**: Node.js heap limitations with high concurrent WebSocket connections
3. **Redis throughput**: Single Redis instance becomes bottleneck for cache/rate-limiting at scale
4. **Static asset serving**: Next.js server handling static files impacts performance
5. **Network I/O**: Single NGINX instance limitations

## Scaling Strategy for 100k+ Users

### 1. Infrastructure Scaling

#### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 10  # Scale to 10 instances
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    deploy:
      replicas: 5  # Scale frontend servers
```

#### Kubernetes Migration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 20
  selector:
    matchLabels:
      app: backend
  template:
    spec:
      containers:
      - name: backend
        image: eco-bottle-backend:latest
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### 2. Database Optimization

#### MongoDB Replica Set Configuration
```javascript
// MongoDB Replica Set (minimum 3 nodes)
rs.initiate({
  _id: "eco-bottle-rs",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1, arbiterOnly: true }
  ]
});

// Connection pooling configuration
const mongoOptions = {
  maxPoolSize: 100,  // Increase from default 10
  minPoolSize: 10,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};
```

#### Database Sharding
```javascript
// Shard by userId for user data
sh.enableSharding("eco_bottle");
sh.shardCollection("eco_bottle.users", { "_id": "hashed" });

// Shard by timestamp for time-series data
sh.shardCollection("eco_bottle.leads", { "createdAt": 1, "_id": 1 });
```

#### Indexing Strategy
```javascript
// Critical indexes for performance
db.products.createIndex({ category: 1, price: 1 });
db.products.createIndex({ "name": "text", "description": "text" });
db.leads.createIndex({ email: 1, createdAt: -1 });
db.leads.createIndex({ status: 1, createdAt: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
```

### 3. Caching Strategy

#### Multi-tier Caching
```javascript
// L1 Cache: In-memory (Node.js)
const NodeCache = require('node-cache');
const l1Cache = new NodeCache({ stdTTL: 10 });

// L2 Cache: Redis Cluster
const Redis = require('ioredis');
const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
]);

// L3 Cache: CDN (CloudFlare/Fastly)
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'public, s-maxage=3600, max-age=600',
    'Surrogate-Control': 'max-age=86400',
    'CDN-Cache-Control': 'max-age=86400'
  });
  next();
});
```

#### Redis Cluster Configuration
```conf
# redis-cluster.conf
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 4. Message Queue Implementation

#### BullMQ for Background Jobs
```javascript
const { Queue, Worker } = require('bullmq');

// Order processing queue
const orderQueue = new Queue('orders', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Worker with concurrency
new Worker('orders', processOrder, {
  connection: redis,
  concurrency: 50
});
```

### 5. Rate Limiting at Scale

#### Distributed Rate Limiting with Redis Cluster
```javascript
const RateLimiter = require('rate-limiter-flexible');

const rateLimiter = new RateLimiter.RateLimiterRedis({
  storeClient: redisCluster,
  keyPrefix: 'rl',
  points: 100,
  duration: 900,
  blockDuration: 900,
  execEvenly: true,
  // Sharding across Redis nodes
  shards: 3
});
```

### 6. CDN Integration

#### CloudFlare Configuration
```javascript
// Cloudflare Workers for edge caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  let response = await cache.match(cacheKey);

  if (!response) {
    response = await fetch(request);
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'max-age=3600');
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
```

### 7. Auto-scaling Configuration

#### AWS Auto Scaling
```yaml
# AWS ECS Task Definition
{
  "family": "eco-bottle-backend",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "backend",
    "image": "eco-bottle-backend:latest",
    "memory": 2048,
    "cpu": 1024,
    "essential": true
  }]
}

# Auto Scaling Policy
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 180
}
```

### 8. Connection Pooling

#### PgBouncer-style Pooling for MongoDB
```javascript
const { MongoClient } = require('mongodb');

class ConnectionPool {
  constructor(uri, options) {
    this.uri = uri;
    this.options = {
      maxPoolSize: 200,
      minPoolSize: 50,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 5000,
      ...options
    };
    this.connections = [];
  }

  async getConnection() {
    // Implement connection pooling logic
  }
}
```

### 9. Circuit Breaker Pattern

```javascript
const CircuitBreaker = require('opossum');

const dbCircuit = new CircuitBreaker(databaseOperation, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10
});

dbCircuit.on('open', () => {
  logger.error('Circuit breaker opened - falling back to cache');
});

dbCircuit.fallback(() => {
  return getCachedData();
});
```

### 10. Monitoring & Alerting

#### Grafana Dashboard Queries
```promql
# Alert when response time > 500ms
avg(rate(http_request_duration_seconds_sum[5m])) > 0.5

# Alert when error rate > 1%
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01

# Alert when memory usage > 80%
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.8
```

## Performance Optimization Checklist

### Application Level
- [x] Enable HTTP/2 in NGINX
- [x] Implement request/response compression
- [x] Use connection keep-alive
- [x] Implement database query optimization
- [ ] Add database query result caching
- [ ] Implement GraphQL with DataLoader
- [ ] Use WebSocket for real-time features
- [ ] Implement server-sent events for updates

### Database Level
- [ ] Enable MongoDB WiredTiger compression
- [ ] Implement read preference for secondary reads
- [ ] Setup change streams for real-time sync
- [ ] Implement aggregation pipeline optimization
- [ ] Add MongoDB Atlas Search for full-text search

### Infrastructure Level
- [ ] Setup GeoDNS for global distribution
- [ ] Implement multi-region deployment
- [ ] Setup database read replicas in multiple regions
- [ ] Implement edge computing with Cloudflare Workers
- [ ] Setup DDoS protection with Cloudflare/AWS Shield

### Caching Level
- [ ] Implement Redis Sentinel for HA
- [ ] Setup Redis persistence with AOF
- [ ] Implement cache warming strategies
- [ ] Add browser caching headers
- [ ] Setup Varnish cache layer

## Cost Optimization

### Estimated Monthly Costs for 100k Users
```
AWS/GCP/Azure:
- Compute (20x t3.medium): $600
- Database (MongoDB Atlas M30): $500
- Redis (ElastiCache): $200
- CDN (CloudFlare Pro): $200
- Load Balancer: $25
- Storage (S3): $50
- Monitoring (DataDog): $150
- Total: ~$1,725/month

Alternative (Self-hosted):
- VPS (4x 16GB RAM): $320
- Backup Storage: $50
- CDN (Bunny.net): $20
- Monitoring (Self-hosted): $0
- Total: ~$390/month
```

## Migration Path

### Phase 1: Current State (0-10k users)
- Single Docker Compose deployment
- Basic monitoring with Prometheus
- Manual scaling

### Phase 2: Growth (10k-50k users)
- Migrate to Kubernetes
- Implement Redis Cluster
- Add CDN for static assets
- Setup auto-scaling policies

### Phase 3: Scale (50k-100k users)
- Multi-region deployment
- Database sharding
- Advanced caching strategies
- Message queue implementation

### Phase 4: Enterprise (100k+ users)
- Global edge network
- Multi-cloud deployment
- Real-time data streaming
- ML-based optimization

## Disaster Recovery

### Backup Strategy
```bash
# Automated daily backups
mongodump --uri="$MONGO_URI" --gzip --archive="/backup/mongo-$(date +%Y%m%d).gz"

# Redis backup
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb

# Application state backup to S3
aws s3 sync /backup s3://eco-bottle-backup/$(date +%Y%m%d)/
```

### Recovery Time Objectives
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 15 minutes

## Security Hardening

### Production Security Checklist
- [ ] Enable TLS 1.3 only
- [ ] Implement rate limiting per user
- [ ] Add Web Application Firewall (WAF)
- [ ] Enable CORS with strict origins
- [ ] Implement Content Security Policy (CSP)
- [ ] Add request signing for API calls
- [ ] Enable audit logging
- [ ] Implement intrusion detection
- [ ] Regular security scanning
- [ ] Dependency vulnerability scanning

## Next Steps

1. **Immediate (Week 1)**
   - Setup monitoring dashboards
   - Configure alerting rules
   - Implement basic auto-scaling

2. **Short-term (Month 1)**
   - Migrate to managed database
   - Implement CDN
   - Setup CI/CD pipeline

3. **Medium-term (Quarter 1)**
   - Implement message queuing
   - Setup multi-region deployment
   - Advanced caching strategies

4. **Long-term (Year 1)**
   - Machine learning optimization
   - Predictive scaling
   - Global edge deployment

## Contact

For production deployment assistance or optimization consulting, reach out to the DevOps team.