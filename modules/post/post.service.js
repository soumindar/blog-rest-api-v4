const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const momentTz = require('moment-timezone');
const moment = require('moment');
const userTimezone = require('../../config/timezone.config');
const extention = require('../../utils/get.extention');
const getBaseUrl = require('../../utils/get.base.url');
const userLog = require('../../utils/user-log');
const redisClient = require('../../config/redis.config');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = require('buffer-image-size');

// get all service
const getAll = async (req, res) => {
  try {
    const { page_size, page, search, category, start_date, end_date, order_by, order } = req.query;
    const userId = req.user.id;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const searchKey = (!search) ? '' : `${search.replace('%', ' ')}`;
    const categoryKey = category ?? '';
    const startDate = (start_date) ? new Date(start_date).setHours(23, 59, 59, 999) : null;
    const endDate = (end_date) ? new Date(end_date).setHours(0, 0, 0, 0) : null;
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
      createdAt: momentTz(post.createdAt).tz(userTimezone).format(),
      updatedAt: (!post.updatedAt) ? null : momentTz(post.updatedAt).tz(userTimezone).format(),
      images: (!post.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${post.images}`,
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
    const userId = req.user.id;

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
      createdAt: momentTz(getPost.createdAt).tz(userTimezone).format(),
      updatedAt: (!getPost.updatedAt) ? null : momentTz(getPost.updatedAt).tz(userTimezone).format(),
      images: (!getPost.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${getPost.images}`,
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
    const userId = req.user.id;

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
      createdAt: momentTz(getPost.createdAt).tz(userTimezone).format(),
      updatedAt: (!getPost.updatedAt) ? null : momentTz(getPost.updatedAt).tz(userTimezone).format(),
      images: (!getPost.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${getPost.images}`,
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
    const userId = req.user.id;

    const limit = Number(page_size ?? 10);
    const pages = Number(page ?? 1);
    const offset = Number((pages - 1) * limit);
    const searchKey = (!search) ? '' : `${search.replace('%', ' ')}`;
    const categoryKey = category ?? '';
    const startDate = (start_date) ? new Date(start_date).setHours(23, 59, 59, 999) : null;
    const endDate = (end_date) ? new Date(end_date).setHours(0, 0, 0, 0) : null;
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
      createdAt: momentTz(post.createdAt).tz(userTimezone).format(),
      updatedAt: (!post.updatedAt) ? null : momentTz(post.updatedAt).tz(userTimezone).format(),
      images: (!post.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${post.images}`,
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

      const allowExt = ['.jpg', '.jpeg', '.png'];
      const imageExt = extention.getExt(imageFile.name);
      if (!allowExt.includes(imageExt)) {
        return res.status(422).json({
          message: 'Invalid image format. Allowed format: .jpg, .jpeg, .png',
          statusCode: 422,
        });
      }

      let uploadPath = `${__basedir}/public/images/post/${userId}`;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }

      const dimension = sizeOf(imageFile.data);
      const maxWidth = 1000;
      const maxHeight = 1000;
      let widthNow = dimension.width;
      let heightNow = dimension.height;
      if (widthNow >= maxWidth) {
        widthNow = maxWidth;
        heightNow = Math.ceil((dimension.height / dimension.width) * widthNow);
      }
      if (heightNow >= maxHeight) {
        heightNow = maxHeight;
        widthNow = Math.ceil((dimension.width / dimension.height) * heightNow);
      }
      const compressConfig = {
        lossless: true,
        quality: 60,
        alphaQuality: 80,
      }
      const compressedImg = sharp(imageFile.data).toFormat('jpeg').jpeg(compressConfig).resize(widthNow, heightNow);

      fileName =  Date.now() + imageExt;
      uploadPath += `/${fileName}`;
      await compressedImg.toFile(uploadPath);
    }
    
    let createData = await prisma.post.create({
      data: {
        userId,
        categoryId: category_id,
        title,
        slug,
        contents: content,
        images: fileName,
      }
    });

    const baseUrl = getBaseUrl(req);
    createData = {
      ...createData,
      createdAt: momentTz(createData.createdAt).tz(userTimezone).format(),
      updatedAt: (!createData.updatedAt) ? null : momentTz(createData.updatedAt).tz(userTimezone).format(),
      images: (!createData.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${createData.images}`,
    };

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
        userId: true,
        title: true,
        slug: true,
        images: true,
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

    let fileName = checkPost.images;
    if (req.files) {
      const imageFile = req.files.image;

      const allowExt = ['.jpg', '.jpeg', '.png'];
      const imageExt = extention.getExt(imageFile.name);
      if (!allowExt.includes(imageExt)) {
        return res.status(422).json({
          message: 'Invalid image format. Allowed format: .jpg, .jpeg, .png',
          statusCode: 422,
        });
      }

      
      let uploadPath = `${__basedir}/public/images/post/${userId}`;
      if (checkPost.images && fs.existsSync(`${uploadPath}/${checkPost.images}`)) {
        fs.unlinkSync(`${uploadPath}/${checkPost.images}`);
      }
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }

      const dimension = sizeOf(imageFile.data);
      const maxWidth = 1000;
      const maxHeight = 1000;
      let widthNow = dimension.width;
      let heightNow = dimension.height;
      if (widthNow >= maxWidth) {
        widthNow = maxWidth;
        heightNow = Math.ceil((dimension.height / dimension.width) * widthNow);
      }
      if (heightNow >= maxHeight) {
        heightNow = maxHeight;
        widthNow = Math.ceil((dimension.width / dimension.height) * heightNow);
      }
      const compressConfig = {
        lossless: true,
        quality: 60,
        alphaQuality: 80,
      }
      const compressedImg = sharp(imageFile.data).toFormat('jpeg').jpeg(compressConfig).resize(widthNow, heightNow);

      fileName =  Date.now() + imageExt;
      uploadPath += `/${fileName}`;
      await compressedImg.toFile(uploadPath);
    } 

    let slug;
    if (title == checkPost.title) {
      slug = checkPost.slug;
    } else {
      slug = title.toLowerCase().replace(/\W+/g, '-');
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
    }

    let updateData = await prisma.post.update({
      data: {
        categoryId: category_id,
        title,
        slug,
        contents: content,
        images: fileName,
      },
      where: { id: postId },
    });

    const baseUrl = getBaseUrl(req);
    updateData = {
      ...updateData,
      createdAt: momentTz(updateData.createdAt).tz(userTimezone).format(),
      updatedAt: (!updateData.updatedAt) ? null : momentTz(updateData.updatedAt).tz(userTimezone).format(),
      images: (!updateData.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${updateData.images}`,
    };

    await userLog.createLog(userId, `edit post ${updateData.id}`);

    return res.status(200).json({
      message: 'update success',
      statusCode: 200,
      data: updateData,
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

// get all optimized service
const getAllOp = async (req, res) => {
  try {
    const { page_size, search, category, start_date, end_date, order_by, order, last_data } = req.query;
    const userId = req.user.id;

    const limit = Number(page_size ?? 10);
    const searchKey = (!search) ? '' : `${search.replace('%', ' ')}`;
    const categoryKey = category ?? '';
    const startDate = (start_date) ? new Date(moment(start_date).endOf('day').valueOf()) : new Date(moment().endOf('day').valueOf());
    const endDate = (end_date) ? new Date(moment(end_date).startOf('day').valueOf()) : new Date(moment().startOf('month').valueOf());
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
      take: limit,
      orderBy:{},
    };

    queryObj.orderBy[orderBy] = orderKey;
    if (orderBy === 'createdAt') {
      if (new Date(last_data).getTime() <= 0) {
        return res.status(400).json({
          message: 'last_data must be in timestamp format',
          statusCode: 400,
        });
      }
      if (orderKey === 'desc') {
        const lastCreatedAt = (last_data) ? new Date(last_data) : startDate;
        queryObj.where['createdAt'] = {
          lt: lastCreatedAt,
          gte: endDate,
        };
      } else {
        const lastCreatedAt = (last_data) ? new Date(last_data) : endDate;
        queryObj.where['createdAt'] = {
          gt: lastCreatedAt,
          lte: startDate,
        };
      }
    } else if (orderBy === 'title') {
      const getSlug = await prisma.post.aggregate({
        _min: { slug: true },
        _max: { slug: true },
      });
      const minSlug = getSlug._min.title;
      const maxSlug = getSlug._max.title;
      if (orderKey === 'desc') {
        const lastSlug = last_data ?? maxSlug;
        queryObj.where['slug'] = { lt: lastSlug };
      } else {
        const lastSlug = last_data ?? minSlug;
        queryObj.where['slug'] = { gt: lastSlug };
      }
      queryObj.where['createdAt'] = {
        lte: startDate,
        gte: endDate,
      };
    }

    if (categoryKey) {
      queryObj.where['category'] = { category: categoryKey };
    }

    const getPost = await prisma.post.findMany(queryObj);

    let lastData = null;
    if (getPost.length > 0) {
      if (orderBy === 'createdAt') {
        lastData = getPost[getPost.length - 1].createdAt;
      } else {
        lastData = getPost[getPost.length - 1].slug;
      }
    }

    const baseUrl = getBaseUrl(req);
    const postData = getPost.map(post => ({
      ...post,
      createdAt: momentTz(post.createdAt).tz(userTimezone).format(),
      updatedAt: (!post.updatedAt) ? null : momentTz(post.updatedAt).tz(userTimezone).format(),
      images: (!post.images) ? `${baseUrl}/images/post/no-image.jpeg` : `${baseUrl}/images/post/${userId}/${post.images}`,
    }));
    
    let totalWhereObj;
    if (orderBy === 'createdAt') {
      totalWhereObj = {
        ...queryObj.where,
        createdAt: {
          lte: startDate,
          gte: endDate,
        },
      };
    } else {
      totalWhereObj = { ...queryObj.where };
      delete totalWhereObj.slug;
    }

    const getTotalData = await prisma.post.aggregate({
      _count: { id: true },
      where: totalWhereObj,
    });
    const totalData = getTotalData._count.id;;
    
    let endOfPage = false;
    if (postData.length === 0) {
      endOfPage = true;
    }
    
    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: postData,
      meta: {
        page_size: limit,
        total_data: totalData,
        last_data: lastData,
        end_of_page: endOfPage,
      }
    });
  } catch (error) {
    console.log(error);
    req.error = error.message;
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

module.exports = {
  createPost,
  getAll,
  getById,
  getByTitle,
  getByUser,
  editPost,
  deletePost,
  getAllOp,
}