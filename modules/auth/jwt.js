const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const jwtVerify = async (req, res, next) => {
  try {
    const getToken = req.headers['authorization'];

    if (!getToken) {
      return res.status(401).json({
        message: 'no token',
        statusCode: 401
      });
    }

    const token = getToken.replace('Bearer ', '');
    const getUser = await prisma.users.findFirst({
      select: {
        id: true,
        token: true,
      },
      where: {
          token: token,
          deleted: null
      }
    });

    if (!getUser) {
      return res.status(401).json({
        message: 'token invalid',
        statusCode: 401
      });
    }

    try {
      jwt.verify(token, process.env.SECRET);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
        statusCode: 400,
      });
    }
    
    req['user'] = { id: getUser.id };
    req['token'] = token;

    return next();
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

module.exports = jwtVerify;