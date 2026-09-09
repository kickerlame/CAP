'use strict';

// =============================================================
// VPPT — src/modules/auth/auth.routes.js
// =============================================================

const rateLimit  = require('express-rate-limit');
const router     = require('express').Router();
const { body }   = require('express-validator');
const validate   = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const ctrl       = require('./auth.controller');

// Dedicated rate limiter for login to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Max 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

// POST /auth/login
router.post('/login',
  loginLimiter,
  [
    body('identifier').notEmpty().withMessage('Username or email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  ctrl.login,
);

// POST /auth/refresh
router.post('/refresh',
  [body('refreshToken').notEmpty().withMessage('refreshToken is required.')],
  validate,
  ctrl.refresh,
);

// POST /auth/logout  (must be logged in)
router.post('/logout', authenticate, ctrl.logout);

// GET /auth/me  (must be logged in)
router.get('/me', authenticate, ctrl.me);

module.exports = router;
