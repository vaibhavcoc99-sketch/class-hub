const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  day: String,
  subject: String,
  faculty: String,
  room: String,
  time: String
});

module.exports = mongoose.model("Timetable", timetableSchema);