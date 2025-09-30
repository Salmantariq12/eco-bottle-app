const promClient = require('prom-client');
const logger = require('./logger');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const inFlightRequests = new promClient.Gauge({
  name: 'in_flight_requests',
  help: 'Number of requests currently being processed'
});

const dbOperationDuration = new promClient.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection', 'success'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

const rateLimitExceeded = new promClient.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded events',
  labelNames: ['endpoint']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(inFlightRequests);
register.registerMetric(dbOperationDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(rateLimitExceeded);

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  inFlightRequests.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status: res.statusCode
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    inFlightRequests.dec();

    logger.info('Request processed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}s`,
      ip: req.ip
    });
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDuration,
  httpRequestTotal,
  inFlightRequests,
  dbOperationDuration,
  cacheHits,
  cacheMisses,
  rateLimitExceeded
};