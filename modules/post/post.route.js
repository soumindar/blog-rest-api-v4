const express = require('express');
const router = express.Router();
const jwtVerify = require('../auth/jwt');
const postValidator = require('./post.validator');
const postService = require('./post.service');

// use jwt verification
router.use(jwtVerify);

// get data
router.get('/', postValidator.queryData, postService.getData);

// get by id
router.get('/id/:id', postValidator.paramId, postService.getById);

// get by title
router.get('/title/:slug', postValidator.paramSlug, postService.getByTitle);

// get by user
router.get('/user/:username', postValidator.paramUsername, postValidator.queryData, postService.getByUser);

// create post
router.post('/create', postValidator.createData, postService.createPost);

// update post
router.patch('/edit/:id', postValidator.paramId, postValidator.createData, postService.editPost);

// delete post
router.delete('/delete/:id', postValidator.paramId, postService.deletePost);

module.exports = router;