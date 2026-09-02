'use strict';

const rateLimit = require('express-rate-limit');

const errorResponse = (req, res) =>
  res.status(429).json({
    error: { message: 'Too many requests — please try again later', code: 'RATE_LIMITED' },
  });

/**
 * Strict limiter for auth endpoints — protects against brute-force attacks.
 * 20 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorResponse,
});

/**
 * General API limiter — applied globally.
 * 100 requests per minute per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: errorResponse,
});

module.exports = { authLimiter, apiLimiter };
