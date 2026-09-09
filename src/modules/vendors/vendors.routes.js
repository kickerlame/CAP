'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl     = require('./vendors.controller');

router.use(authenticate);

router.get('/',           ctrl.list);
router.get('/:id',        ctrl.getOne);
router.post('/',          authorize('manage_vendors'), [
  body('vendorName').notEmpty(),
  body('vendorCode').notEmpty(),
], validate, ctrl.create);
router.patch('/:id',      authorize('manage_vendors'), ctrl.update);
router.delete('/:id',     authorize('manage_vendors'), ctrl.remove);

router.get('/:id/snapshots',   ctrl.snapshots);
router.post('/:id/snapshots',  authorize('manage_vendors'), ctrl.recalc);

router.get('/:id/sla',    ctrl.getSLA);
router.post('/:id/sla',   authorize('manage_vendors'), [
  body('contractStartDate').isISO8601().withMessage('contractStartDate must be a valid date.'),
], validate, ctrl.createSLA);

module.exports = router;
