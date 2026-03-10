import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: String,
  subject: String,
  faculty: String,
  description: String,
  dueDate: Date
});

export default mongoose.model("Assignment", assignmentSchema);