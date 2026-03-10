const Timetable = require("../models/timetable");

const createTimetable = async (req, res) => {
  try {
    const data = new Timetable(req.body);
    const savedData = await data.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTimetable = async (req, res) => {
  try {
    const data = await Timetable.find({});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTimetable,
  getTimetable
};