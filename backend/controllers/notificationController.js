const Notification = require("../models/Notification");

// CREATE: Add a new notification
const createNotification = async (req, res) => {
  try {
    const data = await Notification.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: "Error creating notification", error: error.message });
  }
};

// READ: Get all notifications
const getNotifications = async (req, res) => {
  try {
    const data = await Notification.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications
};