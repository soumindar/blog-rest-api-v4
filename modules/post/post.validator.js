const { param, query, check, validationResult } = require('express-validator');

// get query validator
const queryData = [
  query('pagination').optional().isInt({min: 1}).withMessage('pagination must be integer larger than 0'),
  query('page').optional().isInt({min: 1}).withMessage('page must be integer larger than 0'),
  query('start_date').optional().isDate().withMessage('start_date must be type date in yyyy-mm-dd format'),
  query('end_date').optional().isDate().withMessage('end_date must be type date in yyyy-mm-dd format'),
  query('order_by').optional().isIn(['title', 'created_at']).withMessage('order_by can only be title or created_at'),
  query('order').optional().matches(/^((asc)|(desc))$/).withMessage('order can only be asc or desc'),
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

const createData = [
  check('category_id').notEmpty().withMessage('category_id cannot be empty'),
  check('title').notEmpty().withMessage('title cannot be empty'),
  check('content').notEmpty().withMessage('content cannot be empty'),
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

const paramId = [
  param('id').notEmpty().withMessage('id cannot be empty'),
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

const paramUsername = [
  param('username').notEmpty().withMessage('username cannot be empty'),
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

const paramSlug = [
  check('slug').notEmpty().withMessage('title cannot be empty'),
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

// get query validator
const queryDataOp = [
  query('pagination').optional().isInt({min: 1}).withMessage('pagination must be integer larger than 0'),
  query('start_date').optional().isDate().withMessage('start_date must be type date in yyyy-mm-dd format'),
  query('end_date').optional().isDate().withMessage('end_date must be type date in yyyy-mm-dd format'),
  query('order_by').optional().isIn(['title', 'created_at']).withMessage('order_by can only be title or created_at'),
  query('order').optional().matches(/^((asc)|(desc))$/).withMessage('order can only be asc or desc'),
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
  queryData,
  createData,
  paramId,
  paramUsername,
  paramSlug,
  queryDataOp,
};