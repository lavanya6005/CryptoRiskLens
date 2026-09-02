'use strict';

const logger = require('../utils/logger');

/**
 * Global error-handling middleware.
 * Produces a consistent { error: { message, code } } response shape.
 * Must be registered LAST in the Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';
  const code = err.code ?? (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR');

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path} → ${statusCode}: ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.path} → ${statusCode}: ${message}`);
  }

  return res.status(statusCode).json({ error: { message, code } });
}

module.exports = { errorHandler };
