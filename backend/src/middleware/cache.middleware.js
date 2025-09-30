const Redis = require('ioredis');
const etag = require('etag');
const logger = require('../logger');
const { cacheHits, cacheMisses } = require('../metrics');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis cache client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis cache client connected');
});

const generateCacheKey = (req) => {
  const baseKey = `cache:${req.method}:${req.originalUrl || req.url}`;
  const userId = req.user?._id || 'anonymous';
  return `${baseKey}:${userId}`;
};

const cacheMiddleware = (options = {}) => {
  const {
    ttl = 30,
    cacheType = 'api',
    keyGenerator = generateCacheKey,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    if (!condition(req)) {
      return next();
    }

    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        const data = JSON.parse(cachedData);
        const responseEtag = etag(cachedData);

        cacheHits.inc({ cache_type: cacheType });

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('ETag', responseEtag);
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);

        if (req.headers['if-none-match'] === responseEtag) {
          return res.status(304).end();
        }

        logger.debug('Cache hit', { key, cacheType });
        return res.json(data);
      }

      cacheMisses.inc({ cache_type: cacheType });

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          const dataString = JSON.stringify(data);
          const responseEtag = etag(dataString);

          redisClient.setex(key, ttl, dataString).catch((err) => {
            logger.error('Failed to cache response', { error: err.message, key });
          });

          res.setHeader('X-Cache', 'MISS');
          res.setHeader('ETag', responseEtag);
          res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message, key });
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info('Cache invalidated', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Cache invalidation error', { error: error.message, pattern });
  }
};

const invalidateProductCache = async () => {
  await invalidateCache('cache:*:*/api/v1/products*');
};

const invalidateUserCache = async (userId) => {
  await invalidateCache(`cache:*:*:${userId}`);
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateProductCache,
  invalidateUserCache,
  redisClient
};