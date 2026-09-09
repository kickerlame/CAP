'use strict';

// =============================================================
// VPPT — src/modules/auth/auth.service.js
// Business logic for authentication and session management.
//
// Decisions documented here:
//  - PR/PO numbers:  service-layer MAX+1 (atomic via transaction)
//  - Refresh tokens: SHA-256 hash stored in refresh_tokens table
//  - Passwords:      bcrypt, cost factor 12
// =============================================================

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../../config/database');
const config = require('../../config/config');
const { AppError } = require('../../middleware/errorHandler');

const BCRYPT_ROUNDS = 12;

// ── helpers ───────────────────────────────────────────────────
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signAccess(userId, roleId) {
  return jwt.sign(
    { userId, roleId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

function signRefresh(userId) {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn },
  );
}

/** Parse a JWT expiry string like '7d' or '8h' into a Date */
function expiresAtDate(expiresIn) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = String(expiresIn).match(/^(\d+)([smhd])$/i);
  if (!match) return new Date(Date.now() + 7 * 86400 * 1000); // default 7d
  const seconds = parseInt(match[1], 10) * (units[match[2].toLowerCase()] || 86400);
  return new Date(Date.now() + seconds * 1000);
}

// ── login ─────────────────────────────────────────────────────
async function login(identifier, password) {
  // Accept username OR email
  const [rows] = await db.query(
    `SELECT u.user_id, u.role_id, u.password_hash, u.full_name,
            u.email, u.username, u.is_active, u.deleted_at,
            r.role_name, r.permissions
     FROM   users u
     JOIN   roles r ON r.role_id = u.role_id
     WHERE  (u.username = ? OR u.email = ?)`,
    [identifier, identifier],
  );

  const user = rows[0];
  // Use constant-time compare even if user not found (prevents timing attacks)
  const dummyHash = '$2b$12$invalidhashfortimingnormalization0000000000000000000';
  const match = await bcrypt.compare(password, user?.password_hash ?? dummyHash);

  if (!user || !match) {
    throw new AppError('Invalid username or password.', 401);
  }
  if (!user.is_active || user.deleted_at) {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
  }

  // Issue tokens
  const accessToken  = signAccess(user.user_id, user.role_id);
  const refreshToken = signRefresh(user.user_id);
  const tokenHash    = hashToken(refreshToken);

  // Persist refresh token
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.user_id, tokenHash, expiresAtDate(config.jwt.refreshExpiresIn)],
  );

  // Update last_login_at
  await db.query(
    `UPDATE users SET last_login_at = NOW() WHERE user_id = ?`,
    [user.user_id],
  );

  return {
    accessToken,
    refreshToken,
    user: {
      userId:   user.user_id,
      username: user.username,
      email:    user.email,
      fullName: user.full_name,
      roleId:   user.role_id,
      roleName: user.role_name,
    },
  };
}

// ── refresh ───────────────────────────────────────────────────
async function refresh(rawRefreshToken) {
  let payload;
  try {
    payload = jwt.verify(rawRefreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const tokenHash = hashToken(rawRefreshToken);
  const [rows] = await db.query(
    `SELECT token_id, revoked, expires_at
     FROM   refresh_tokens
     WHERE  token_hash = ? AND user_id = ?`,
    [tokenHash, payload.userId],
  );

  const record = rows[0];
  if (!record || record.revoked || new Date(record.expires_at) < new Date()) {
    throw new AppError('Refresh token is invalid, revoked, or expired.', 401);
  }

  // Load role for new access token
  const [userRows] = await db.query(
    `SELECT role_id FROM users WHERE user_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    [payload.userId],
  );
  if (!userRows.length) {
    throw new AppError('User account no longer exists or is inactive.', 401);
  }

  const accessToken = signAccess(payload.userId, userRows[0].role_id);
  return { accessToken };
}

// ── logout ────────────────────────────────────────────────────
async function logout(rawRefreshToken, userId) {
  const tokenHash = hashToken(rawRefreshToken);
  await db.query(
    `UPDATE refresh_tokens SET revoked = 1
     WHERE  token_hash = ? AND user_id = ?`,
    [tokenHash, userId],
  );
}

// ── me ────────────────────────────────────────────────────────
async function getMe(userId) {
  const [rows] = await db.query(
    `SELECT u.user_id, u.username, u.email, u.full_name,
            u.is_active, u.last_login_at,
            r.role_id, r.role_name,
            d.department_id, d.dept_name, d.dept_code
     FROM   users u
     JOIN   roles r ON r.role_id = u.role_id
     LEFT JOIN departments d ON d.department_id = u.department_id
     WHERE  u.user_id = ? AND u.deleted_at IS NULL`,
    [userId],
  );
  if (!rows.length) throw new AppError('User not found.', 404);
  const u = rows[0];
  return {
    userId:       u.user_id,
    username:     u.username,
    email:        u.email,
    fullName:     u.full_name,
    isActive:     !!u.is_active,
    lastLoginAt:  u.last_login_at,
    role:         { roleId: u.role_id, roleName: u.role_name },
    department:   u.department_id
      ? { departmentId: u.department_id, deptName: u.dept_name, deptCode: u.dept_code }
      : null,
  };
}

// ── hashPassword ──────────────────────────────────────────────
async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

module.exports = { login, refresh, logout, getMe, hashPassword };
