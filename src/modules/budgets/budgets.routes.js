'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl     = require('./budgets.controller');

router.use(authenticate);

router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);
router.post('/',      authorize('manage_budgets'), [
  body('departmentId').isInt({ min: 1 }),
  body('fiscalYear').isInt({ min: 2000, max: 2100 }),
  body('budgetName').notEmpty(),
  body('totalAmount').isFloat({ min: 0 }),
], validate, ctrl.create);
router.patch('/:id',  authorize('manage_budgets'), ctrl.update);

router.get('/:id/transactions',   ctrl.txnList);
router.post('/:id/transactions',  authorize('manage_budgets'), [
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
  body('transactionType').isIn(['debit','credit','adjustment']),
], validate, ctrl.txnAdd);

module.exports = router;
