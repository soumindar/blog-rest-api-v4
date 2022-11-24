const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/db_activity_log', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => console.log(error));
db.once('open', () => console.log('MongoDB Connected'));

module.exports = db;