'use strict';

/**
 * requireAdmin middleware
 *
 * Must run AFTER requireAuth (so req.user is already populated with role).
 * Rejects non-admin requests with 403 Forbidden.
 * The response intentionally reveals nothing about what the admin area contains.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
      },
    });
  }
  next();
}

module.exports = { requireAdmin };
