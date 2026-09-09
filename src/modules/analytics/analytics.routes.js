'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl   = require('./analytics.controller');

router.use(authenticate);

// All analytics endpoints are read-only
// manager and above can access; procurement/inventory roles can view_reports
router.get('/kpis',                    ctrl.kpis);
router.get('/vendor-scorecards',       ctrl.vendorScorecards);
router.get('/delivery-performance',    ctrl.deliveryPerformance);
router.get('/defect-heatmap',          ctrl.defectHeatmap);
router.get('/po-cycle-time',           ctrl.poCycleTime);
router.get('/bottleneck',              ctrl.bottleneck);
router.get('/inventory-status',        ctrl.inventoryStatus);
router.get('/budget-utilization',      ctrl.budgetUtilization);
router.get('/procurement-pipeline',    ctrl.pipeline);

// Alerts
router.get('/alerts',                  ctrl.alerts);
router.patch('/alerts/:id/read',       ctrl.ackAlert);

module.exports = router;
