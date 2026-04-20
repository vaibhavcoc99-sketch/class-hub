const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    presentRollNos: [{
        type: String
    }],
    absentRollNos: [{
        type: String
    }]
}, { timestamps: true });

// Prevent duplicate attendance for the same subject on the same day
attendanceSessionSchema.index({ date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
