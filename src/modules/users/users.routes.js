'use strict';

// =============================================================
// VPPT — src/modules/users/users.routes.js
// =============================================================

const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl     = require('./users.controller');

// All routes require authentication
router.use(authenticate);

// GET  /users
router.get('/', authorize('manage_users'), ctrl.list);

// GET  /users/:id
router.get('/:id', ctrl.getOne);

// POST /users
router.post('/',
  authorize('manage_users'),
  [
    body('username').notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('fullName').notEmpty().withMessage('Full name is required.'),
    body('roleId').isInt({ min: 1 }).withMessage('A valid roleId is required.'),
  ],
  validate,
  ctrl.create,
);

// PATCH /users/:id
router.patch('/:id', authorize('manage_users'), ctrl.update);

// DELETE /users/:id
router.delete('/:id', authorize('manage_users'), ctrl.remove);

// GET /departments  (any authenticated user)
router.get('/departments/list', ctrl.departments);

// GET /roles  (admin only)
router.get('/roles/list', authorize('manage_settings'), ctrl.roles);

module.exports = router;
