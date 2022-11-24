const express = require('express');
const router = express.Router();
const authValidator = require('./auth.validator');
const authService = require('./auth.service');
const jwtVerify = require('./jwt');

// register
router.post('/register', authValidator.registerData, authService.register);

// login
router.post('/login', authValidator.loginData, authService.login);

// logout
router.get('/logout', jwtVerify, authService.logout);

module.exports = router;