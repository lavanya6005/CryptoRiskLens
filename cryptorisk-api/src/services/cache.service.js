'use strict';

const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get a value from Redis. Returns null if not found or on error.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn(`Cache.get failed for key "${key}": ${err.message}`);
    return null;
  }
}

/**
 * Set a value in Redis with optional TTL (seconds).
 * @param {string} key
 * @param {any}    value   Will be JSON-serialised
 * @param {number} [ttl]   TTL in seconds; omit for no expiry
 */
async function set(key, value, ttl) {
  try {
    const serialised = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialised);
    } else {
      await redis.set(key, serialised);
    }
  } catch (err) {
    logger.warn(`Cache.set failed for key "${key}": ${err.message}`);
  }
}

/**
 * Delete one or more keys.
 * @param {string|string[]} keys
 */
async function del(keys) {
  try {
    const keyArr = Array.isArray(keys) ? keys : [keys];
    if (keyArr.length) await redis.del(...keyArr);
  } catch (err) {
    logger.warn(`Cache.del failed: ${err.message}`);
  }
}

module.exports = { get, set, del };
