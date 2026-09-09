'use strict';

// =============================================================
// VPPT — src/middleware/auth.js
// JWT authentication and role-based permission middleware.
//
// Exports:
//   authenticate         – verifies Bearer token, populates req.user
//   authorize(...perms)  – RBAC check against req.user.permissions JSON
// =============================================================

const jwt    = require('jsonwebtoken');
const config = require('../config/config');
const db     = require('../config/database');
const { AppError } = require('./errorHandler');

// ── authenticate ──────────────────────────────────────────────
/**
 * Verifies the JWT in `Authorization: Bearer <token>`.
 * On success: attaches req.user = { userId, roleId, roleName, permissions }
 * On failure: calls next(AppError 401)
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return next(err); // Forwarded to errorHandler (JWT errors mapped to 401)
    }

    // Load user + role/permissions (single join query)
    const [rows] = await db.query(
      `SELECT u.user_id, u.role_id, u.is_active, u.deleted_at,
              r.role_name, r.permissions
       FROM   users u
       JOIN   roles r ON r.role_id = u.role_id
       WHERE  u.user_id = ?`,
      [payload.userId],
    );

    if (!rows.length) {
      return next(new AppError('User account not found.', 401));
    }

    const user = rows[0];
    if (!user.is_active || user.deleted_at) {
      return next(new AppError('User account is inactive or has been deactivated.', 403));
    }

    // Attach to request for downstream middleware / controllers
    req.user = {
      userId:      user.user_id,
      roleId:      user.role_id,
      roleName:    user.role_name,
      permissions: typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

// ── authorize ─────────────────────────────────────────────────
/**
 * Factory that returns an Express middleware enforcing permission checks.
 * Must be used AFTER `authenticate`.
 *
 * Usage:
 *   router.post('/', authenticate, authorize('manage_vendors'), controller.create);
 *   router.get('/',  authenticate, authorize('view_analytics', 'view_reports'), controller.list);
 *
 * The user must possess AT LEAST ONE of the provided permissions (OR logic).
 * Use multiple `authorize` calls in series for AND logic.
 *
 * @param {...string} perms  Permission key(s) from the roles.permissions JSON
 * @returns {Function} Express middleware
 */
function authorize(...perms) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { permissions, roleName } = req.user;

    // Admin always passes (shortcut)
    if (roleName === 'admin') return next();

    const allowed = perms.some((perm) => permissions[perm] === true);
    if (!allowed) {
      return next(
        new AppError(
          `Access denied. Required permission(s): ${perms.join(', ')}.`,
          403,
        ),
      );
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
