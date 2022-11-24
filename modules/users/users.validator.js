const { body, check, validationResult } = require('express-validator');

// param id validator
const paramId = [
  check('id').notEmpty().withMessage('param id cannot be empty'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400,
        data: {}
      });
    }

    next();
  }
];

// username validator
const username = [
  check('username').notEmpty().withMessage('username param cannot be empty'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400,
        data: {}
      });
    }

    next();
  }
];

// update data validator
const updateData = [
  body('name').notEmpty().withMessage('name cannot be empty'),
  body('username').isAlphanumeric().withMessage('username must be alphanumeric'),
  body('username').isLength({min: 3}).withMessage('username must be at least 3 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400,
        data: {}
      });
    }

    next();
  }
];

// change password validator
const newPass = [
  body('new_pass').notEmpty().withMessage('new_pass cannot be empty'),
  body('new_pass').isLength({min: 6}).withMessage('new_pass must at least have 6 characters'),
  body('confirm_pass').notEmpty().withMessage('confirm_pass cannot be empty'),
  body('confirm_pass').isLength({min: 6}).withMessage('confirm_pass must at least have 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array(),
        statusCode: 400,
      });
    }

    next();
  }
];

module.exports = {
  paramId,
  username,
  updateData,
  newPass,
};