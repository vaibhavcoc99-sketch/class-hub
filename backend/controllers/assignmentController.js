import Assignment from "../models/Assignment.js";

// CREATE: Add a new assignment
export const createAssignment = async (req, res) => {
  try {
    const data = await Assignment.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: "Error creating assignment", error: error.message });
  }
};

// READ: Get all assignments
export const getAssignments = async (req, res) => {
  try {
    const data = await Assignment.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments", error: error.message });
  }
};
