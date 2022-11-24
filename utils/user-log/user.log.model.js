const mongoose = require('mongoose');

const UserLog = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    activity: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("UserLog", UserLog);