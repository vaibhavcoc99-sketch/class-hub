import express from "express";
const { createTimetable, getTimetable } = require("../controllers/timetableController");
const router = express.Router();

router.post("/", createTimetable);
router.get("/", getTimetable);

module.exports = router;