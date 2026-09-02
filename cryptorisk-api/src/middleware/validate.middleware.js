'use strict';

const { ZodError } = require('zod');
const logger = require('../utils/logger');

/**
 * validate(schema) — Zod schema middleware factory.
 * Validates req.body against the provided Zod schema.
 * Returns 400 with field-level errors on failure.
 *
 * @param {import('zod').ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', issues },
        });
      }
      next(err);
    }
  };
}

/**
 * validateQuery(schema) — same as validate() but for req.query.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: { message: 'Invalid query parameters', code: 'VALIDATION_ERROR' },
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, validateQuery };
