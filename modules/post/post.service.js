const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment-timezone');
const userTimezone = require('../../config/timezone.config');
const extention = require('../../utils/get.extention');
const getBaseUrl = require('../../utils/get.base.url');
const userLog = require('../../utils/user-log');
const redisClient = require('../../config/redis.config');

// get data service
const getData = async (req, res) => {
  try {
    const { page_size, page, search, category, start_date, end_date, order_by, order } = req.query;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const searchKey = (!search) ? '' : `${search.replace('%', ' ')}`;
    const categoryKey = category ?? '';
    const startDate = (start_date) ? new Date(start_date).setHours(0, 0, 0, 0) : null;
    const endDate = (end_date) ? new Date(end_date).setHours(23, 59, 59, 999) : null;
    const orderBy = order_by ?? 'createdAt';
    const orderKey = order ?? 'desc';
    
    if (categoryKey) {
      const categoryExist = await prisma.category.findUnique({
        where: { category: categoryKey },
      });
      
      if (!categoryExist) {
        return res.status(404).json({
          message: 'category not found',
          statusCode: 404,
          data: [],
        });
      }
    }

    let queryObj = {
      select: {
        id: true,
        title: true,
        slug: true,
        contents: true,
        images: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            category: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
      },
      where: {
        deleted: null,
        OR: [
          {
            title: {
              contains: searchKey,
              mode: 'insensitive',
            }
          },
          {
            contents: {
              contains: searchKey,
              mode: 'insensitive',
            }
          }
        ],
      },
      skip: offset,
      take: limit,
      orderBy:{},
    };

    queryObj.orderBy[orderBy] = orderKey;
    if (categoryKey) {
      queryObj.where['category'] = { category: categoryKey };
    }
    if (startDate && endDate) {
      queryObj.where['createdAt'] = {
        gte: startDate,
        lte: endDate,
      }
    }
    const getPost = await prisma.post.findMany(queryObj);
    
    const baseUrl = getBaseUrl(req);
    const postData = getPost.map(post => ({
      ...post,
      createdAt: moment(post.createdAt).tz(userTimezone).format(),
      updatedAt: (!post.updatedAt) ? null : moment(post.updatedAt).tz(userTimezone).format(),
      images: (!post.images) ? baseUrl + '/images/no-image.jpeg' : baseUrl + '/images/' + post.images
    }));
    
    const getTotalData = await prisma.post.aggregate({
      _count: { id: true },
      where: queryObj.where,
    });
    const totalData = getTotalData._count.id;;
    const totalPage = Math.ceil(totalData / limit);
    
    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: postData,
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

// get by id service
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    let isCahced = false;
    let getPost;
    const cacheResult = await redisClient.get(id);
    if (cacheResult) {
      isCahced = true;
      getPost = JSON.parse(cacheResult);
    } else {
      getPost = await prisma.post.findFirst({
        select: {
          id: true,
          title: true,
          slug: true,
          contents: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              category: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
        },
        where: {
          id: id,
          deleted: null,
        },
      });

      if (!getPost) {
        return res.status(404).json({
          message: 'post not found',
          statusCode: 404,
          data: {}
        });
      }

      await redisClient.set(id, JSON.stringify(getPost));
    }

    const baseUrl = getBaseUrl(req);
    const postData = {
      ...getPost,
      createdAt: moment(getPost.created_at).tz(userTimezone).format(),
      updatedAt: (!getPost.updatedAt) ? null : moment(getPost.updatedAt).tz(userTimezone).format(),
      images: (!getPost.images) ? baseUrl + '/images/no-image.jpeg' : baseUrl + '/images/' + getPost.images
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      from_cahce: isCahced,
      data: postData,
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get by title service
const getByTitle = async (req, res) => {
  try {
    const { slug } = req.params;

    let isCahced = false;
    let getPost;
    const cacheResult = await redisClient.get(slug);
    if (cacheResult) {
      isCahced = true;
      getPost = JSON.parse(cacheResult);
    } else {
      getPost = await prisma.post.findFirst({
        select: {
          id: true,
          title: true,
          slug: true,
          contents: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              category: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
        },
        where: {
          slug: slug,
          deleted: null,
        },
      });

      if (!getPost) {
        return res.status(404).json({
          message: 'post not found',
          statusCode: 404,
          data: {}
        });
      }

      await redisClient.set(slug, JSON.stringify(getPost));
    }
    
    const baseUrl = getBaseUrl(req);
    const postData = {
      ...getPost,
      createdAt: moment(getPost.created_at).tz(userTimezone).format(),
      updatedAt: (!getPost.updatedAt) ? null : moment(getPost.updatedAt).tz(userTimezone).format(),
      images: (!getPost.images) ? baseUrl + '/images/no-image.jpeg' : baseUrl + '/images/' + getPost.images
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      from_cahce: isCahced,
      data: postData
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get by user service
const getByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { page_size, page, search, category, start_date, end_date, order_by, order } = req.query;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const searchKey = (!search) ? '' : `${search.replace('%', ' ')}`;
    const categoryKey = category ?? '';
    const startDate = (start_date) ? new Date(start_date).setHours(0, 0, 0, 0) : null;
    const endDate = (end_date) ? new Date(end_date).setHours(23, 59, 59, 999) : null;
    const orderBy = order_by ?? 'createdAt';
    const orderKey = order ?? 'desc';

    const usernameExist = await prisma.users.findFirst({
      select: { username: true },
      where: {
        username: username,
        deleted: null
      },
    });
    if (!usernameExist) {
      return res.status(404).json({
        message: 'username not found',
        statusCode: 404
      });
    }

    if (categoryKey) {
      const categoryExist = await prisma.category.findUnique({
        select: { category: true },
        where: { category: categoryKey },
      });
      
      if (!categoryExist) {
        return res.status(404).json({
          message: 'category not found',
          statusCode: 404,
          data: []
        });
      }
    }

    let queryObj = {
      select: {
        id: true,
        title: true,
        slug: true,
        contents: true,
        images: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            category: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
      },
      where: {
        deleted: null,
        user: {
          username: username
        },
        OR: [
          {
            title: {
              contains: searchKey,
              mode: 'insensitive',
            }
          },
          {
            contents: {
              contains: searchKey,
              mode: 'insensitive',
            }
          }
        ],
      },
      skip: offset,
      take: limit,
      orderBy:{},
    };

    queryObj.orderBy[orderBy] = orderKey;
    if (categoryKey) {
      queryObj.where['category'] = { category: categoryKey };
    }
    if (startDate && endDate) {
      queryObj.where['createdAt'] = {
        gte: startDate,
        lte: endDate,
      }
    }
    const getPost = await prisma.post.findMany(queryObj);
    
    const baseUrl = getBaseUrl(req);
    const postData = getPost.map(post => ({
      ...post,
      createdAt: moment(post.createdAt).tz(userTimezone).format(),
      updatedAt: (!post.updatedAt) ? null : moment(post.updatedAt).tz(userTimezone).format(),
      images: (!post.images) ? baseUrl + '/images/no-image.jpeg' : baseUrl + '/images/' + post.images
    }));

    const getTotalData = await prisma.post.aggregate({
      _count: { id: true},
      where: queryObj.where,
    });
    const totalData = getTotalData._count.id;
    const totalPage = Math.ceil(totalData / limit);

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: postData,
      meta: {
        page_size: Number(limit),
        page: Number(pages),
        total_data: Number(totalData),
        total_page: Number(totalPage)
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

// // create post service
const createPost = async (req, res) => {
  try {
    const { category_id, title, content } = req.body;
    const userId = req.user.id;

    const categoryExist =  await prisma.category.findUnique({
      select: { id: true },
      where: { id: category_id },
    });
    if (!categoryExist) {
      return res.status(404).json({
        message: 'category_id not found',
        statusCode: 404
      });
    }

    let slug = title.toLowerCase().replace(/\W+/g, '-');
    const slugExist = await prisma.slug.findFirst({
      select: {
        id: true,
        counter: true,
      },
      where: { slug: slug },
    });
    if (slugExist) {
      const counterNow = slugExist.counter + 1
      await prisma.slug.update({
        data: {
          counter: counterNow,
        },
        where: {
          id: slugExist.id,
        },
      });
      slug = slug + '-' + counterNow;
    } else {
      await prisma.slug.create({
        data: {
          slug: slug,
          counter: 1,
        }
      });
    }

    let fileName = null;
    if (req.files) {
      const imageFile = req.files.image;
      fileName =  Date.now() + extention.getExt(imageFile.name);
      const uploadPath = __basedir + '/public/images/' + fileName;
      imageFile.mv(uploadPath, function(err) {
        if (err) {
          return res.status(500).send(err);
        }
      });
    }
    
    const createData = await prisma.post.create({
      data: {
        userId,
        categoryId: category_id,
        title,
        slug,
        contents: content,
        images: fileName,
      }
    });

    await userLog.createLog(userId, `create post ${createData.id}`);

    return res.status(200).json({
      message: 'create success',
      statusCode: 200,
      data: createData
    });
  } catch (error) {
    console.log(error.message);
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// // edit post service
const editPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const postId = id;
    const { category_id, title, content } = req.body;

    const checkPost = await prisma.post.findFirst({
      select: {
        id: true,
        userId: true
      },
      where: {
        id: postId,
        deleted: null
      },
    });
    if (!checkPost) {
      return res.status(404).json({
        message: 'post id not found',
        statusCode: 404
      });
    }
    if (checkPost.userId != userId) {
      return res.status(400).json({
        message: 'post not owned by this user',
        statusCode: 400
      });
    }

    const categoryExist = await prisma.category.findUnique({
      select: { id: true },
      where: { id: category_id },
    });
    if (!categoryExist) {
      return res.status(404).json({
        message: 'category_id not found',
        statusCode: 404
      });
    }

    let fileName = null;
    if (req.files) {
      const imageFile = req.files.image;
      fileName =  Date.now() + extention.getExt(imageFile.name);
      const uploadPath = __basedir + '/public/images/' + fileName;
      imageFile.mv(uploadPath, function(err) {
        if (err) {
          return res.status(500).send(err);
        }
      });
    } 

    let slug = title.toLowerCase().replace(/\W+/g, '-');
    const slugExist = await prisma.slug.findFirst({
      select: { counter: true },
      where: { slug: slug },
    });
    if (slugExist) {
      const counterNow = slugExist.counter + 1
      await prisma.slug.update({
        data: {
          counter: counterNow,
        },
        where: {
          slug: slug,
        },
      });
      slug = slug + '-' + counterNow;
    } else {
      await prisma.slug.create({
        data: {
          slug: slug,
          counter: 1,
        }
      });
    }

    const updateData = await prisma.post.update({
      data: {
        categoryId: category_id,
        title,
        slug,
        contents: content,
        images: fileName,
      },
      where: { id: postId },
    });

    await userLog.createLog(userId, `edit post ${updateData.id}`)
    return res.status(200).json({
      message: 'update success',
      statusCode: 200,
      data: updateData
    });
  } catch (error) {
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// // delete post service
const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const postId = id;

    const checkPost = await prisma.post.findFirst({
      select: {
        id: true,
        userId: true
      },
      where: {
        id: postId,
        deleted: null,
      },
    });
    if (!checkPost) {
      return res.status(404).json({
        message: 'post id not found',
        statusCode: 404
      });
    }
    if (checkPost.userId != userId) {
      return res.status(400).json({
        message: 'post not owned by this user',
        statusCode: 400
      });
    }

    const deleteData = await prisma.post.update({
      data: { deleted: new Date() },
      where: { id: postId },
    });
    
    await userLog.createLog(userId, `delete post ${deleteData.id}`);
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
  createPost,
  getData,
  getById,
  getByTitle,
  getByUser,
  editPost,
  deletePost,
}