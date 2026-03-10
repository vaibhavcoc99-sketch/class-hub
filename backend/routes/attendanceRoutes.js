import express from "express";
import Attendance from "../models/attendance.js";

const router = express.Router();

router.post("/", async(req,res)=>{
  const data = await Attendance.create(req.body);
  res.json(data);
});

router.get("/", async(req,res)=>{
  const data = await Attendance.find();
  res.json(data);
});

export default router;