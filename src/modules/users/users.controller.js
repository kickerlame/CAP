'use strict';

// =============================================================
// VPPT — src/modules/users/users.controller.js
// =============================================================

const svc = require('./users.service');

const list = async (req, res, next) => {
  try {
    const { page, limit, roleId, departmentId, isActive } = req.query;
    const { total, rows } = await svc.listUsers({ page, limit, roleId, departmentId, isActive });
    res.json({ success: true, data: rows, meta: { total, page: Number(page || 1), limit: Number(limit || 20) } });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await svc.getUser(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await svc.createUser(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await svc.updateUser(Number(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.deleteUser(Number(req.params.id), req.user.userId);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) { next(err); }
};

const departments = async (req, res, next) => {
  try {
    const data = await svc.listDepartments();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const roles = async (req, res, next) => {
  try {
    const data = await svc.listRoles();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove, departments, roles };
