import Assignment from "../models/Assignment.js";

export const createAssignment = async (req,res)=>{
  const data = await Assignment.create(req.body);
  res.json(data);
};

export const getAssignments = async (req,res)=>{
  const data = await Assignment.find();
  res.json(data);
};