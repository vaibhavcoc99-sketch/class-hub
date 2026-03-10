import Notification from "../models/Notification.js";

export const createNotification = async (req,res)=>{
  const data = await Notification.create(req.body);
  res.json(data);
};

export const getNotifications = async (req,res)=>{
  const data = await Notification.find();
  res.json(data);
};