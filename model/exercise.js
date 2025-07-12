const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String
  },
  description: {
    type: String
  },
  duration: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Exercise", exerciseSchema);
