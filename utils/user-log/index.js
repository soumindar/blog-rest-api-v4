const db = require('./db.connection');
const UserLog = require('./user.log.model');
const moment = require('moment-timezone');
const userTimezone = require('../../config/timezone.config');

const createLog = async (userId, activity) => {
  try {
    await UserLog.create({ userId, activity });
  } catch (err) {
    throw err;
  }
};

const getLog = async (userId, limit, page, offset, startDate, endDate) => {
  try {
    const whereObj = {
      userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      }
    };
    const select = '_id userId activity createdAt'
    const logs = await UserLog
                        .find(whereObj)
                        .select(select)
                        .skip(offset)
                        .limit(limit)
                        .sort({ createdAt: -1 })
                        .lean();

    const data = logs.map(log => ({
      ...log,
      createdAt: moment(log.createdAt).tz(userTimezone).format(),
    }));
    
    const totalData = await UserLog.find(whereObj).count();
    const totalPage = Math.ceil(totalData / limit);

    return {
      data,
      meta: {
        page_size: limit,
        page: page,
        total_data: totalData,
        total_page: totalPage,
      }
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createLog,
  getLog,
};