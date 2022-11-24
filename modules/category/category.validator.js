const { query, validationResult } = require('express-validator');

const queryData = [
  query('order_by').optional().isIn(['id', 'category']).withMessage('order_by can only be id or category'),
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
};