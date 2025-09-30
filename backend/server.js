const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
require('dotenv').config();

const logger = require('./src/logger');
const { register, metricsMiddleware } = require('./src/metrics');
const apiRoutes = require('./src/routes/api');
const { apiLimiter } = require('./src/middleware/rateLimit.middleware');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/eco_bottle';
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_CLUSTER = process.env.NODE_CLUSTER === 'true';

const startServer = async () => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(metricsMiddleware);

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1', apiRoutes);

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      logger.error('Error generating metrics', { error: error.message });
      res.status(500).end();
    }
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'Eco Bottle API',
      version: '1.0.0',
      status: 'running',
      environment: NODE_ENV
    });
  });

  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });

    const status = err.status || 500;
    const message = NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

    res.status(status).json({
      error: message,
      ...(NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected successfully', { uri: MONGO_URI });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server started on port ${PORT}`, {
        environment: NODE_ENV,
        pid: process.pid,
        worker: cluster.worker?.id || 'master'
      });
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed');
      });

      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

if (USE_CLUSTER && cluster.isMaster) {
  const numWorkers = parseInt(process.env.WORKERS) || os.cpus().length;

  logger.info(`Master process starting ${numWorkers} workers...`, { pid: process.pid });

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`, { code, signal });
    logger.info('Starting a new worker...');
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  startServer();
}