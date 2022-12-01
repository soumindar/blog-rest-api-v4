const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');
const userTimezone = require('../../config/timezone.config');
const userLog = require('../../utils/user-log');
const extention = require('../../utils/get.extention');
const getBaseUrl = require('../../utils/get.base.url');
const fs = require('fs');
const sharp = require('sharp');

// get user data service
const getData = async (req, res) => {
  try {
    const userId = req.user.id;    
    
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: userId },
    });
    
    const baseUrl = getBaseUrl(req);
    const data = {
      ...user,
      avatar: (!user.avatar) ? `${baseUrl}/images/avatar/no-avatar.jpeg` : `${baseUrl}/images/avatar/${userId}/${user.avatar}`,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get user logs
const getLog = async (req, res) => {
  try {
    const { page_size, page, start_date, end_date } = req.query;
    const userId = req.user.id;
    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const startDate = (start_date) ? new Date(start_date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = (end_date) ? new Date(end_date) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const logs = await userLog.getLog(userId, limit, pages, offset, startDate, endDate);

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: logs.data,
      meta: logs.meta,
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get all users service
const getAll = async (req, res) => {
  try {
    const { page_size, page } = req.query;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);

    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
      },
      where: { deleted: null },
      skip: offset,
      take: limit,
      orderBy: { name: 'asc' },
    });

    const baseUrl = getBaseUrl(req);
    const data = users.map(user => ({
        ...user,
        avatar: (!user.avatar) ? `${baseUrl}/images/avatar/no-avatar.jpeg` : `${baseUrl}/images/avatar/${user.id}/${user.avatar}`,
        createdAt: moment(user.createdAt).tz(userTimezone).format(),
        updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
      })
    );

    const getTotalData = await prisma.users.aggregate({
      _count: {id: true},
      where: { deleted: null },
    });
    const totalData = getTotalData._count.id;
    const maxPage = Math.ceil(totalData / limit);

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
      meta: {
        page_size: limit,
        page: pages,
        total_data: totalData,
        total_page: maxPage,
      },
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get user by id service
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        id: id,
        deleted: null,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: 'user not found',
        statusCode: 404
      });
    }

    const baseUrl = getBaseUrl(req);
    const data = {
      ...user,
      avatar: (!user.avatar) ? `${baseUrl}/images/avatar/no-avatar.jpeg` : `${baseUrl}/images/avatar/${id}/${user.avatar}`,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
};

// get user by username service
const getByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        username: username,
        deleted: null,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: 'username not found',
        statusCode: 404
      });
    }

    const baseUrl = getBaseUrl(req);
    const data = {
      ...user,
      avatar: (!user.avatar) ? `${baseUrl}/images/avatar/no-avatar.jpeg` : `${baseUrl}/images/avatar/${userId}/${user.avatar}`,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// update user service
const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, username } = req.body;

    const usernameExist = await prisma.users.findFirst({
      select: { username: true },
      where: {
        username: username,
        id: {
          not: userId,
        }
      },
    });

    if (usernameExist) {
      return res.status(409).json({
        message: 'username is already exist',
        statusCode: 409
      });
    }

    await prisma.users.update({
      data: {
        name,
        username,
      },
      where: { id: userId },
    });

    await userLog.createLog(userId, 'update user data');

    return res.status(200).json({
      message: 'update success',
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

// change avatar service
const changeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const avatarFile = req.files.avatar;
    const allowExt = ['.jpg', '.jpeg', '.png'];
    const avatarExt = extention.getExt(avatarFile.name);
    if (!allowExt.includes(avatarExt)) {
      return res.status(422).json({
        message: 'Invalid avatar format. Allowed format: .jpg, .jpeg, .png',
        statusCode: 422,
      });
    }

    let uploadPath = `${__basedir}/public/images/avatar/${userId}`;
    const avatarExist = await prisma.users.findUnique({
      select: { avatar: true },
      where: { id: userId },
    });
    if (avatarExist.avatar && fs.existsSync(`${uploadPath}/${avatarExist.avatar}`)) {
      fs.unlinkSync(`${uploadPath}/${avatarExist.avatar}`);
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    const compressConfig = {
      lossless: true,
      quality: 60,
      alphaQuality: 80,
    }
    const compressedImg = sharp(avatarFile.data).toFormat('jpeg').jpeg(compressConfig).resize(1000, 1000);

    const fileName =  Date.now() + avatarExt;
    uploadPath += `/${fileName}`;
    await compressedImg.toFile(uploadPath);

    await prisma.users.update({
      data: {
        avatar: fileName,
      },
      where: { id: userId },
    });
    
    const baseUrl = getBaseUrl(req);
    const avatarUrl = `${baseUrl}/images/avatar/${userId}/${fileName}`;

    return res.status(200).json({
      message: 'change avatar success',
      statusCode: 200,
      data: {
        avatar: avatarUrl,
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

// change password service
const changePass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_pass, new_pass, confirm_pass } = req.body;

    if (new_pass != confirm_pass) {
      return res.status(400).json({
        message: 'confirm_pass must be same with new_pass',
        statusCode: 400
      });
    }

    const user = await prisma.users.findUnique({
      select: { password: true },
      where: {
        id: userId,
      },
    });
    const oldPassMatch = bcrypt.compareSync(old_pass, user.password);
    if (!oldPassMatch) {
      return res.status(400).json({
        message: 'old password is wrong',
        statusCode: 400
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_pass, salt);
    await prisma.users.update({
      data: {
        password: hashedPassword,
        token: null,
      },
      where: { id: userId },
    });
    
    await userLog.createLog(userId, 'change password');

    return res.status(200).json({
      message: 'change password success',
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

// delete user service
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.users.update({
      data: {
        deleted: new Date(),
      },
      where: { id: userId },
    });

    await userLog.createLog(userId, 'delete user');
    
    return res.status(200).json({
      message: 'delete success',
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
  getData,
  getLog,
  getAll,
  getById,
  getByUsername,
  updateUser,
  changeAvatar,
  changePass,
  deleteUser,
}