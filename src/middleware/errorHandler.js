'use strict';

// =============================================================
// VPPT — src/middleware/errorHandler.js
// Centralised 404 and global error-handling middleware.
// Place notFoundHandler AFTER all routes, errorHandler LAST.
// =============================================================

const logger = require('../config/logger');

// ── notFoundHandler ───────────────────────────────────────────
/**
 * Catches requests that matched no route.
 * Must be registered AFTER all route middleware.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// ── AppError ──────────────────────────────────────────────────
/**
 * Operational (expected) errors thrown by service/controller layers.
 * Use this instead of generic Error so the handler can distinguish
 * operational from programming errors.
 *
 * @example
 *   throw new AppError('Vendor not found', 404);
 *   throw new AppError('Insufficient budget', 422, { field: 'amount' });
 */
class AppError extends Error {
  /**
   * @param {string}  message    Human-readable error message
   * @param {number}  statusCode HTTP status code (default 500)
   * @param {object}  [meta]     Optional extra data for the response body
   */
  constructor(message, statusCode = 500, meta = null) {
    super(message);
    this.name       = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.meta       = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── errorHandler ──────────────────────────────────────────────
/**
 * Global Express error handler.
 * Must be registered LAST (4-argument signature).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known operational errors (AppError instances)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.meta && { meta: err.meta }),
    });
  }

  // MySQL duplicate-entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique identifier already exists.',
    });
  }

  // MySQL foreign-key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(422).json({
      success: false,
      message: 'Referenced resource does not exist.',
    });
  }

  // JWT errors (forwarded from auth middleware)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid token.',
    });
  }

  // SyntaxError from body parser (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body.',
    });
  }

  // Unknown / programming errors — log full stack, return generic 500
  logger.error('Unhandled server error:', {
    message: err.message,
    stack:   err.stack,
    url:     req.originalUrl,
    method:  req.method,
  });

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again later.',
  });
}

module.exports = { notFoundHandler, errorHandler, AppError };
