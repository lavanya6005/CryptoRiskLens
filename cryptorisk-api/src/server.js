'use strict';

const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/database');
const redis = require('./config/redis');
const logger = require('./utils/logger');

async function start() {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    logger.info('Database: connected');

    // Connect to Redis
    await redis.connect();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server: listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('Server: closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`Fatal startup error: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

start();
