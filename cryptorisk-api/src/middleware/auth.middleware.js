'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * requireAuth middleware
 * Verifies the Bearer token in the Authorization header.
 * Attaches { id, email } to req.user on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Missing or malformed Authorization header', code: 'UNAUTHORIZED' },
    });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();

  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Access token has expired' : 'Invalid access token';
    return res.status(401).json({ error: { message, code: 'UNAUTHORIZED' } });
  }
}

module.exports = { requireAuth };
