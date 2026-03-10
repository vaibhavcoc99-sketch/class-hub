import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  priority: String
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);