const express = require('express');
const router = express.Router();
const authValidator = require('./auth.validator');
const authService = require('./auth.service');

// register
router.post('/register', authValidator.registerData, authService.register);

// login
router.post('/login', authValidator.loginData, authService.login);

// logout
router.get('/logout', authService.logout);

module.exports = router;