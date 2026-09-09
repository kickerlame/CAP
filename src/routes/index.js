'use strict';

// =============================================================
// VPPT — src/routes/index.js
// Master router — mounts all module sub-routers under their paths.
// All routes are prefixed by config.apiPrefix (e.g. /api/v1) in app.js.
// =============================================================

const router = require('express').Router();

router.use('/auth',        require('../modules/auth/auth.routes'));
router.use('/users',       require('../modules/users/users.routes'));
router.use('/vendors',     require('../modules/vendors/vendors.routes'));
router.use('/inventory',   require('../modules/inventory/inventory.routes'));
router.use('/procurement', require('../modules/procurement/procurement.routes'));
router.use('/budgets',     require('../modules/budgets/budgets.routes'));
router.use('/analytics',   require('../modules/analytics/analytics.routes'));

module.exports = router;
