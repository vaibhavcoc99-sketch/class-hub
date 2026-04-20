const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['urgent', 'important', 'normal'], default: 'normal' },
    audience: { type: String, default: 'All Students' },
    facultyName: { type: String, default: 'Faculty' },
    facultyId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
