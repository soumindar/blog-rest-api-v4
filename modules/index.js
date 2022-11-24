const express = require('express');
const router = express.Router();
const authRouter = require('./auth/auth.route');
const categoryRouter = require('./category/category.route');
const usersRouter = require('./users/users.route');
const postRouter = require('./post/post.route');

router.use('/auth', authRouter);
router.use('/category', categoryRouter);
router.use('/users', usersRouter);
router.use('/post', postRouter);

module.exports = router;