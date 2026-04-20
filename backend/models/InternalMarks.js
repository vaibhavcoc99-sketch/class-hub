const mongoose = require('mongoose');

const studentMarkSchema = new mongoose.Schema({
    rollNo: { type: String, required: true },
    name:   { type: String, default: '' },
    ct1:    { type: Number, default: null },
    ct2:    { type: Number, default: null },
    assignmentMarks: { type: Number, default: null }, // out of 5
    attendanceMarks: { type: Number, default: null }  // out of 5
}, { _id: false });

const internalMarksSchema = new mongoose.Schema({
    subject:     { type: String, required: true, unique: true },
    facultyName: { type: String, default: 'Faculty' },
    marks:       [studentMarkSchema]
}, { timestamps: true });

module.exports = mongoose.model('InternalMarks', internalMarksSchema);
