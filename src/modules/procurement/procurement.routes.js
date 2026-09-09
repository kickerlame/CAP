'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl     = require('./procurement.controller');

router.use(authenticate);

// ── Purchase Requisitions ──────────────────────────────────────
router.get('/requisitions',          ctrl.listPRs);
router.get('/requisitions/:id',      ctrl.getPR);
router.post('/requisitions',
  [
    body('departmentId').isInt({ min: 1 }).withMessage('departmentId is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one line item is required.'),
    body('items.*.itemId').isInt({ min: 1 }).withMessage('Each item must have a valid itemId.'),
    body('items.*.quantityRequested').isInt({ min: 1 }).withMessage('Each item must have a quantityRequested >= 1.'),
  ],
  validate,
  ctrl.createPR,
);
router.patch('/requisitions/:id/status',
  authorize('manage_procurement'),
  [body('status').notEmpty().withMessage('status is required.')],
  validate,
  ctrl.advancePR,
);

// ── Purchase Orders ────────────────────────────────────────────
router.get('/orders',                ctrl.listPOs);
router.get('/orders/:id',            ctrl.getPO);
router.post('/orders',
  authorize('manage_procurement'),
  [
    body('vendorId').isInt({ min: 1 }).withMessage('vendorId is required.'),
    body('departmentId').isInt({ min: 1 }).withMessage('departmentId is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one line item is required.'),
    body('items.*.itemId').isInt({ min: 1 }),
    body('items.*.quantityOrdered').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.createPO,
);
router.patch('/orders/:id/status',
  authorize('manage_procurement'),
  [body('status').notEmpty()],
  validate,
  ctrl.advancePO,
);
router.post('/orders/:id/delivery',    authorize('manage_inventory'), [
  body('actualDate').isISO8601().withMessage('actualDate must be a valid date.'),
], validate, ctrl.delivery);
router.post('/orders/:id/inspection',  authorize('manage_inventory'), ctrl.inspection);
router.post('/orders/:id/returns',     authorize('manage_inventory'), ctrl.returns);
router.get('/orders/:id/stages',       ctrl.stages);

module.exports = router;
