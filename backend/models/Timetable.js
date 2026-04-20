const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    time: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { type: String, default: '' },
    room: { type: String, default: '' },
    isBreak: { type: Boolean, default: false }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    // Single document stores the full weekly timetable
    Monday:    [slotSchema],
    Tuesday:   [slotSchema],
    Wednesday: [slotSchema],
    Thursday:  [slotSchema],
    Friday:    [slotSchema],
    Saturday:  [slotSchema],
    Sunday:    [slotSchema]
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
