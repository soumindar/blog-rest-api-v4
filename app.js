const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const cors = require('cors');
const corsOption = require('./config/cors.option');
const fileUpload = require('express-fileupload');
const rfs = require('rotating-file-stream');
const moment = require('moment');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const indexRouter = require('./modules/index');

global.__basedir = __dirname;

const accessLogStream = rfs.createStream(`${moment().format('YYYY-MM-DD')}.log`, {
  size: '10M',
  interval: '1d',
  path: path.join(__dirname, "log"),
  compress: 'gzip',
});
logger.token('json', (req, res) => req.error);

const app = express();
app.use(logger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status - message: ":json" - :res[content-length] ":referrer" ":user-agent"',
    {
      stream: accessLogStream,
      skip: (req, res) => res.statusCode < 500,
    }
  )
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors(corsOption()));

app.use(fileUpload());

app.use('/', indexRouter);


module.exports = app;