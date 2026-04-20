const mongoose = require('mongoose');

const studentStatsSchema = new mongoose.Schema({
    rollNo: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    attendanceStats: [{
        subject: { type: String },
        totalClasses: { type: Number, default: 0 },
        attendedClasses: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('StudentStats', studentStatsSchema);
