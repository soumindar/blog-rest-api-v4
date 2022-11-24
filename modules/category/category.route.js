const express = require('express');
const router = express.Router();
const jwtVerify = require('../auth/jwt');
const categoryValidator = require('./category.validator');
const categoryService = require('./category.service');

// use jwt verification
router.use(jwtVerify);

// get category
router.get('/', categoryValidator.queryData, categoryService.getData);

module.exports = router;