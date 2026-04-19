const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { type: String, required: true },
    type: { type: String, required: true }, // e.g. 'Lab Record', 'Theory'
    deadline: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    facultyName: { type: String }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
