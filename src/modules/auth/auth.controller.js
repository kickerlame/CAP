'use strict';

// =============================================================
// VPPT — src/modules/auth/auth.controller.js
// =============================================================

const authService = require('./auth.service');
const { AppError } = require('../../middleware/errorHandler');

// POST /auth/login
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('refreshToken is required.', 400));
    const result = await authService.refresh(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout  (requires authenticate)
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('refreshToken is required.', 400));
    await authService.logout(refreshToken, req.user.userId);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me  (requires authenticate)
async function me(req, res, next) {
  try {
    const data = await authService.getMe(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me };
