const { body, validationResult } = require('express-validator');

// register data validator
const registerData = [
  body('name').notEmpty().withMessage('name cannot be empty'),
  body('username').isAlphanumeric().withMessage('username must be alphanumeric'),
  body('username').isLength({min: 3}).withMessage('username must be at least 3 characters long'),
  body('password').isLength({min: 6}).withMessage('password must at least have 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400
      });
    }

    next();
  }
];

// login data validator
const loginData = [
  body('username').notEmpty().withMessage('username cannot be empty'),
  body('password').notEmpty().withMessage('password cannot be empty'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400
      });
    }

    next();
  }
];

module.exports = {
  registerData,
  loginData,
};