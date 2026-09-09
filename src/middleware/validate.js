'use strict';

// =============================================================
// VPPT — src/middleware/validate.js
// Wraps express-validator's validationResult into a consistent
// 422 response so controllers don't repeat this boilerplate.
//
// Usage in a route file:
//   const { body } = require('express-validator');
//   const validate  = require('../middleware/validate');
//
//   router.post('/',
//     [body('email').isEmail(), body('password').notEmpty()],
//     validate,
//     controller.create,
//   );
// =============================================================

const { validationResult } = require('express-validator');

/**
 * Express middleware that checks express-validator results.
 * On failure: responds 422 with a structured errors array.
 * On success: calls next().
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(422).json({
    success: false,
    message: 'Validation failed.',
    errors:  errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
      value:   e.value,
    })),
  });
}

module.exports = validate;
