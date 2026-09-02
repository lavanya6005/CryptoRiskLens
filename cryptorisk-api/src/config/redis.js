'use strict';

const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) {
      logger.error('Redis: max retries reached, giving up');
      return null; // stop retrying
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => logger.info('Redis: connected'));
redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

module.exports = redis;
