const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getData = async (req, res) => {
  try {
    const { page_size, page, order_by, order } = req.query;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const orderBy = order_by ?? 'category';
    const orderKey = order ?? 'asc';

    let queryObj = {
      skip: offset,
      take: limit,
    };
    if (orderBy === 'id') {
      queryObj['orderBy'] = { id: orderKey };
    } else {
      queryObj['orderBy'] = { category: orderKey };
    }

    const getTotalData = await prisma.category.aggregate({
      _count: {
        category: true
      }
    });
    const totalData = getTotalData._count.category;
    const totalPage = Math.ceil(totalData / limit);

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: getCategory,
      meta: {
        page_size: limit,
        page: pages,
        total_data: totalData,
        total_page: totalPage,
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

module.exports = {
  getData,
};