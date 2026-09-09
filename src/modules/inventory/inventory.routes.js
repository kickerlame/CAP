'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl     = require('./inventory.controller');

router.use(authenticate);

// Hardware catalog
router.get('/hardware-items',       ctrl.items);
router.get('/hardware-categories',  ctrl.cats);

// Inventory
router.get('/',                                         ctrl.list);
router.get('/:id',                                      ctrl.getOne);
router.patch('/:id/recalculate',    authorize('manage_inventory'), ctrl.recalc);

// Transactions
router.get('/:id/transactions',                         ctrl.txnList);
router.post('/:id/transactions',    authorize('manage_inventory'),
  (req, _res, next) => {
    const rawType = req.body.txnType || req.body.transactionType;
    if (rawType) {
      req.body.txnType = String(rawType).toUpperCase();
      req.body.transactionType = req.body.txnType;
    }
    next();
  },
  [
    body('txnType').isIn(['IN','OUT','ADJUSTMENT','RETURN']).withMessage('Invalid txn_type. Must be IN, OUT, ADJUSTMENT, or RETURN.'),
    body('quantity').optional().isInt().withMessage('quantity must be an integer.'),
    body('newStock').optional().isInt({ min: 0 }).withMessage('newStock must be a non-negative integer.'),
  ],
  validate,
  ctrl.txnAdd,
);

module.exports = router;
