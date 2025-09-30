const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../logger');
const { rateLimitExceeded } = require('../metrics');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis client connected for rate limiting');
});

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const endpoint = req.route ? req.route.path : req.path;
      rateLimitExceeded.inc({ endpoint });

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?._id
      });

      res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (req) => {
      if (process.env.NODE_ENV === 'test') return true;
      if (process.env.NODE_ENV === 'development') return true;
      return false;
    }
  };

  const limiterOptions = { ...defaultOptions, ...options };

  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    limiterOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
      sendCommand: (...args) => redisClient.call(...args)
    });
  }

  return rateLimit(limiterOptions);
};

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts from this IP, please try again later.'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skipSuccessfulRequests: true
});

module.exports = {
  apiLimiter,
  strictLimiter,
  authLimiter,
  createRateLimiter,
  redisClient
};