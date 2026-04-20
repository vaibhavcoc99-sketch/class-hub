/**
 * seed_timetable.js
 * Replaces the existing Timetable document in MongoDB with the correct schedule.
 * Run with: node backend/seed_timetable.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Timetable = require('./models/Timetable');

const CORRECT_TIMETABLE = {
    Monday: [
        { time: '09:10 - 10:50', subject: 'Mini Project',               faculty: 'Mr. Abhishek Nagar',    room: 'OS Lab',    isBreak: false },
        { time: '10:50 - 11:40', subject: 'Technical Communication',     faculty: 'Dr. Pragati Shukla',    room: 'Lt 21',     isBreak: false },
        { time: '11:40 - 12:30', subject: 'Sensor & Instrumentation',    faculty: 'Mr. Adeeb',             room: 'EED 201',   isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '02:00 - 03:40', subject: 'Operating System',            faculty: 'Mr. Deepanshu Singh',   room: 'Lt 21',     isBreak: false },
        { time: '03:40 - 04:30', subject: 'Ethical Research',            faculty: 'Miss Kajal',            room: 'Lt 21',     isBreak: false }
    ],
    Tuesday: [
        { time: '09:10 - 10:50', subject: 'Operating System',            faculty: 'Mr. Deepanshu Singh',   room: 'Lt 21',     isBreak: false },
        { time: '10:50 - 12:30', subject: 'Automata',                    faculty: 'Mr. Rakesh',            room: 'Lt 21',     isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '02:00 - 03:40', subject: 'Python Lab',                  faculty: 'Mr. Ahmed Husan',       room: 'OS Lab',    isBreak: false },
        { time: '03:40 - 04:30', subject: 'OOPs in Java',                faculty: 'Dr. Manik Chandra',     room: 'Lt 21',     isBreak: false }
    ],
    Wednesday: [
        { time: '10:50 - 12:30', subject: 'Sensor & Instrumentation',    faculty: 'Mr. Adeeb',             room: 'EED 201',   isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '02:00 - 03:40', subject: 'Python',                      faculty: 'Mr. Ahmed Husan',       room: 'Lt 21',     isBreak: false },
        { time: '03:40 - 04:30', subject: 'Automata',                    faculty: 'Mr. Rakesh',            room: 'Lt 21',     isBreak: false }
    ],
    Thursday: [
        { time: '09:10 - 10:50', subject: 'Automata',                    faculty: 'Mr. Rakesh',            room: 'Lt 21',     isBreak: false },
        { time: '10:50 - 11:40', subject: 'Technical Communication',     faculty: 'Dr. Pragati Shukla',    room: 'Lt 21',     isBreak: false },
        { time: '11:40 - 12:30', subject: 'Ethical Research',            faculty: 'Miss Kajal',            room: 'Lt 21',     isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '02:00 - 03:40', subject: 'Operating System Lab',        faculty: 'Mr. Deepanshu Singh',   room: 'DBMS Lab',  isBreak: false }
    ],
    Friday: [
        { time: '10:00 - 11:40', subject: 'OOPs in Java',                faculty: 'Dr. Manik Chandra',     room: 'Lt 21',     isBreak: false },
        { time: '11:40 - 12:30', subject: 'Technical Communication',     faculty: 'Dr. Pragati Shukla',    room: 'Lt 21',     isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '02:00 - 03:40', subject: 'Sensor & Instrumentation',    faculty: 'Mr. Adeeb',             room: 'EED 201',   isBreak: false },
        { time: '03:40 - 04:30', subject: 'Operating System',            faculty: 'Mr. Deepanshu Singh',   room: 'Lt 21',     isBreak: false }
    ],
    Saturday: [
        { time: '09:10 - 10:50', subject: 'OOPs Lab',                    faculty: 'Dr. Manik Chandra',     room: 'DBMS Lab',  isBreak: false },
        { time: '11:40 - 12:30', subject: 'OOPs in Java',                faculty: 'Dr. Manik Chandra',     room: 'Lt 21',     isBreak: false },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK',              faculty: '',                      room: '',          isBreak: true  },
        { time: '03:40 - 04:30', subject: 'Python',                      faculty: 'Mr. Ahmed Husan',       room: 'Lt 21',     isBreak: false }
    ],
    Sunday: []
};

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log('✅ Connected to MongoDB');

        // Delete the old timetable and insert fresh
        await Timetable.deleteMany({});
        await Timetable.create(CORRECT_TIMETABLE);
        console.log('📅 Timetable seeded successfully!');

    } catch (err) {
        console.error('❌ Error seeding timetable:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
