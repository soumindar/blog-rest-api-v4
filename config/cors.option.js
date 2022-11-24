const corsOption = () => ({
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGIN.split(',');
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS error';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
});

module.exports = corsOption;