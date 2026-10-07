const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator checks; short-circuits
 * with a 422 listing every failed field instead of letting bad data
 * reach the controller.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
