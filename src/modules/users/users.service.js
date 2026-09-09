'use strict';

// =============================================================
// VPPT — src/modules/users/users.service.js
// User management and department/role lookups.
// =============================================================

const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { hashPassword } = require('../auth/auth.service');

// ── helpers ───────────────────────────────────────────────────
function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}

// ── listUsers ─────────────────────────────────────────────────
async function listUsers({ page, limit, roleId, departmentId, isActive }) {
  const { offset, limit: lim } = paginate(page, limit);
  const conditions = ['u.deleted_at IS NULL'];
  const params     = [];

  if (roleId)       { conditions.push('u.role_id = ?');        params.push(roleId); }
  if (departmentId) { conditions.push('u.department_id = ?');  params.push(departmentId); }
  if (isActive !== undefined) {
    conditions.push('u.is_active = ?');
    params.push(isActive === 'true' || isActive === '1' ? 1 : 0);
  }

  const where = conditions.join(' AND ');

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM users u WHERE ${where}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT u.user_id, u.username, u.email, u.full_name, u.is_active,
            u.last_login_at, u.created_at,
            r.role_id, r.role_name,
            d.department_id, d.dept_name, d.dept_code
     FROM   users u
     JOIN   roles r ON r.role_id = u.role_id
     LEFT JOIN departments d ON d.department_id = u.department_id
     WHERE  ${where}
     ORDER  BY u.created_at DESC
     LIMIT  ? OFFSET ?`,
    [...params, lim, offset],
  );

  const shaped = rows.map((u) => ({
    userId:      u.user_id,
    username:    u.username,
    email:       u.email,
    fullName:    u.full_name,
    isActive:    !!u.is_active,
    lastLoginAt: u.last_login_at,
    createdAt:   u.created_at,
    role:        { roleId: u.role_id, roleName: u.role_name },
    department:  u.department_id
      ? { departmentId: u.department_id, deptName: u.dept_name, deptCode: u.dept_code }
      : null,
  }));
  return { total, rows: shaped };
}

// ── getUser ───────────────────────────────────────────────────
async function getUser(userId) {
  const [rows] = await db.query(
    `SELECT u.user_id, u.username, u.email, u.full_name, u.is_active,
            u.last_login_at, u.created_at,
            r.role_id, r.role_name, r.permissions,
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
    userId:      u.user_id,
    username:    u.username,
    email:       u.email,
    fullName:    u.full_name,
    isActive:    !!u.is_active,
    lastLoginAt: u.last_login_at,
    createdAt:   u.created_at,
    role:        { roleId: u.role_id, roleName: u.role_name,
                   permissions: typeof u.permissions === 'string'
                     ? JSON.parse(u.permissions) : u.permissions },
    department:  u.department_id
      ? { departmentId: u.department_id, deptName: u.dept_name, deptCode: u.dept_code }
      : null,
  };
}

// ── createUser ────────────────────────────────────────────────
async function createUser({ roleId, departmentId, username, email, password, fullName }) {
  const passwordHash = await hashPassword(password);
  const [result] = await db.query(
    `INSERT INTO users (role_id, department_id, username, email, password_hash, full_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [roleId, departmentId || null, username, email, passwordHash, fullName],
  );
  return getUser(result.insertId);
}

// ── updateUser ────────────────────────────────────────────────
async function updateUser(userId, updates) {
  const allowed = ['role_id', 'department_id', 'full_name', 'email', 'is_active'];
  const setClauses = [];
  const params     = [];

  for (const [k, v] of Object.entries(updates)) {
    if (allowed.includes(k)) {
      setClauses.push(`${k} = ?`);
      params.push(v);
    }
  }

  if (!setClauses.length) throw new AppError('No valid fields provided for update.', 400);
  params.push(userId);

  await db.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE user_id = ? AND deleted_at IS NULL`,
    params,
  );
  return getUser(userId);
}

// ── deleteUser ────────────────────────────────────────────────
async function deleteUser(userId, requesterId) {
  if (userId === requesterId) {
    throw new AppError('You cannot delete your own account.', 400);
  }
  const [result] = await db.query(
    `UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE user_id = ? AND deleted_at IS NULL`,
    [userId],
  );
  if (!result.affectedRows) throw new AppError('User not found.', 404);
}

// ── listDepartments ───────────────────────────────────────────
async function listDepartments() {
  const [rows] = await db.query(
    `SELECT d.department_id, d.dept_name, d.dept_code, d.is_active,
            u.user_id AS head_user_id, u.full_name AS head_name
     FROM   departments d
     LEFT JOIN users u ON u.user_id = d.head_user_id
     ORDER  BY d.dept_name`,
  );
  return rows;
}

// ── listRoles ─────────────────────────────────────────────────
async function listRoles() {
  const [rows] = await db.query(
    `SELECT role_id, role_name, description, permissions FROM roles ORDER BY role_id`,
  );
  return rows.map((r) => ({
    ...r,
    permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
  }));
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, listDepartments, listRoles };
