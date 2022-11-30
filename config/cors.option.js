const corsOption = () => ({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    } else {
      const allowedOrigins = process.env.ALLOWED_ORIGIN.split(',');
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'CORS error';
        return callback(new Error(msg), false);
      } else {
        return callback(null, true);
      }
    }
  }
});

module.exports = corsOption;