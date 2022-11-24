const express = require('express');
const router = express.Router();
const jwtVerify = require('../auth/jwt');
const usersValidator = require('./users.validator');
const usersService = require('./users.service');

// use jwt verification
router.use(jwtVerify);

// get user data
router.get('/', usersService.getData);

// get user logs
router.get('/log', usersService.getLog);

// get all users
router.get('/getall', usersService.getAll);

// get user by id
router.get('/id/:id', usersValidator.paramId, usersService.getById);

// get user by username
router.get('/username/:username', usersValidator.username, usersService.getByUsername);

// update user data
router.patch('/update', usersValidator.updateData, usersService.updateUser);

// change password
router.patch('/change-password', usersValidator.newPass, usersService.changePass);

// delete user
router.delete('/delete', usersService.deleteUser);

module.exports = router;