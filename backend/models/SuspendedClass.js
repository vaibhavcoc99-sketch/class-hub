const mongoose = require('mongoose');

const suspendedClassSchema = new mongoose.Schema({
    subject:     { type: String, required: true },
    day:         { type: String, required: true },   // e.g. "Monday"
    time:        { type: String, required: true },   // e.g. "09:00 - 09:50"
    date:        { type: String, required: true },   // ISO date string "2026-04-20"
    facultyName: { type: String, default: 'Faculty' },
    reason:      { type: String, default: '' }
}, { timestamps: true });

// Unique: one subject can suspend one specific slot per date
suspendedClassSchema.index({ subject: 1, day: 1, time: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SuspendedClass', suspendedClassSchema);
