const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userLog = require('../../utils/user-log');

// register controller
const register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    const usernameExist = await prisma.users.findFirst({
      select: { username: true },
      where: { username: username }
    });

    if (usernameExist) {
      return res.status(409).json({
        message: 'username is already exist',
        statusCode: 409
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const createUser = await prisma.users.create({
      data: {
        name,
        username,
        password: hashedPassword,
      }
    });

    await userLog.createLog(createUser.id, 'register');

    return res.status(200).json({
      message: 'register success',
      statusCode: 200
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// login controller
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.users.findFirst({
      select: {
        id: true,
        password: true,
      },
      where: {
        username,
        deleted: null,
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'username not found',
        statusCode: 404
      });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({
        message: 'wrong password',
        statusCode: 400
      });
    }

    const token = jwt.sign(
      { _id: user.id },
      process.env.SECRET,
      { expiresIn: "2h" }
    );
    
    await prisma.users.update({
      data: { token },
      where: { id: user.id }
    });

    await userLog.createLog(user.id, 'login');
    
    return res.status(200).json({
      message: 'login success',
      statusCode: 200,
      data: {
        user_id: user.id,
        token
      }
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// logout controller
const logout = async (req, res) => {
  try {
    const getToken = req.headers['authorization'];

    if (!getToken) {
      return res.status(401).json({
        message: 'no token',
        statusCode: 401
      });
    }

    const token = getToken.replace('Bearer ', '');
    const tokenMatch = await prisma.users.findFirst({
      select: {
        id: true,
        token: true,
      },
      where: {
          token: token,
          deleted: null
      }
    });

    if (!tokenMatch) {
      return res.status(401).json({
        message: 'token invalid',
        statusCode: 401
      });
    }

    const userId = tokenMatch.id;
    await prisma.users.update({
      data: { token: null },
      where: { id: userId}
    });

    await userLog.createLog(userId, 'logout');

    return res.status(200).json({
      message: 'logout success',
      statusCode: 200
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

module.exports = {
  register,
  login,
  logout,
};