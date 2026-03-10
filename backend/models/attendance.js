import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentName: String,
  rollNo: String,
  percentage: Number
});

export default mongoose.model("Attendance", attendanceSchema);