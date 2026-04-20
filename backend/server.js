/* ===== ClassHub Backend — Express + Nodemailer OTP Server ===== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('./models/User');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Announcement = require('./models/Announcement');
const Timetable = require('./models/Timetable');
const AttendanceSession = require('./models/AttendanceSession');
const StudentStats = require('./models/StudentStats');
const InternalMarks = require('./models/InternalMarks');
const {
    sendBroadcast,
    announcementTemplate,
    assignmentTemplate,
    timetableTemplate,
    alertTemplate
} = require('./emailService');

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });
const PORT = process.env.PORT || 5001;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- Default Timetable Data (used to seed DB on first run) ----
const DEFAULT_TIMETABLE = {
    Monday: [
        { time: '09:10 - 10:50', subject: 'Mini Project', faculty: 'Abhishek Nagar', room: 'Lt 21' },
        { time: '10:50 - 11:40', subject: 'Technical Communication', faculty: 'Dr. Pragati Shukla', room: 'Lt 21' },
        { time: '11:40 - 12:30', subject: 'Sensor & Instrumentation', faculty: 'Adeeb', room: 'EED201' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Operating System', faculty: 'Ass. Dipanshu Singh', room: 'Lt 21' },
        { time: '03:40 - 04:30', subject: 'Ethical Research', faculty: 'Kajal', room: 'Lt 21' }
    ],
    Tuesday: [
        { time: '09:10 - 10:50', subject: 'Operating System', faculty: 'Ass. Dipanshu Singh', room: 'Lt 21' },
        { time: '10:50 - 12:30', subject: 'Automata', faculty: 'Ass. Rakesh', room: 'Lt 21' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Python Lab', faculty: 'Ahmed Husan', room: 'Dbms lab' },
        { time: '03:40 - 04:30', subject: 'OOps in java', faculty: 'Dr.Manik', room: 'Lt 21' }
    ],
    Wednesday: [
        { time: '10:50 - 12:30', subject: 'Sensor & Instrumentation', faculty: 'Adeeb', room: 'EED201' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Python', faculty: 'Ahmed Husan', room: 'Lt 21' }
    ],
    Thursday: [
        { time: '09:10 - 10:50', subject: 'Automata', faculty: 'Ass. Rakesh', room: 'Lt 21' },
        { time: '10:50 - 11:40', subject: 'Technical Communication', faculty: 'Dr. Pragati Shukla', room: 'Lt 21' },
        { time: '11:40 - 12:30', subject: 'Ethical Research', faculty: 'Kajal', room: 'Lt 21' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Operating System Lab', faculty: 'Ass. Dipanshu Singh', room: 'PPS Lab' }
    ],
    Friday: [
        { time: '10:00 - 11:40', subject: 'OOps in java', faculty: 'Dr.Manik', room: 'Lt 21' },
        { time: '11:40 - 12:30', subject: 'Technical Communication', faculty: 'Dr. Pragati Shukla', room: 'Lt 21' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Sensor & Instrumentation', faculty: 'Adeeb', room: 'EED201' },
        { time: '03:40 - 04:30', subject: 'Python', faculty: 'Ahmed Husan', room: 'Lt 21' }
    ],
    Saturday: [
        { time: '09:10 - 10:50', subject: 'OOps Lab', faculty: 'Dr.Manik', room: 'Os lab' },
        { time: '10:50 - 12:30', subject: 'OOps in java', faculty: 'Dr.Manik', room: 'Lt 21' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '03:40 - 04:30', subject: 'Python', faculty: 'Ahmed Husan', room: 'Lt 21' }
    ]
};

// ---- MongoDB Connection ----
mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(async () => {
        console.log('📦 Connected to MongoDB');
        // Auto-seed timetable if none exists
        const existing = await Timetable.findOne();
        if (!existing) {
            await Timetable.create(DEFAULT_TIMETABLE);
            console.log('📅 Default timetable seeded to MongoDB');
        }
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ---- In-memory OTP store (for demo; use MongoDB/Redis in production) ----
const otpStore = new Map(); // email -> { otp, expiresAt }

// ---- Allowed Faculty Whitelist (DEPRECATED - Subjects chosen on signup) ----
const ALLOWED_FACULTY = [];

// ---- Nodemailer Transporter ----
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter on startup
transporter.verify()
    .then(() => console.log('✅ Email transporter ready'))
    .catch(err => console.error('❌ Email transporter error:', err.message));

// ---- Routes ----

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP with 5-minute expiry
    otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Send email
    const mailOptions = {
        from: `"ClassHub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 ClassHub — Your Verification Code',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); padding: 30px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 3px;">CLASSHUB</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Email Verification</p>
                </div>
                <div style="padding: 32px 28px; text-align: center;">
                    <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 24px;">Use the code below to verify your email address:</p>
                    <div style="background: #1e293b; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #a5b4fc; font-family: monospace;">${otp}</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin-top: 8px;">This code expires in <strong style="color: #f59e0b;">5 minutes</strong></p>
                    <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;">
                    <p style="color: #475569; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 OTP sent to ${email}`);
        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Email send error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Check server email config.' });
    }
});

// POST /api/auth/signup (Verifies OTP and Creates User)
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role, rollNo, department, otp } = req.body;

    if (!email || !otp || !name || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // ---- Faculty Subject Uniqueness Validation ----
    if (role === 'faculty') {
        if (!department) {
            return res.status(400).json({ success: false, message: 'Faculty must specify their subject' });
        }
    }

    // 1. Verify OTP
    const stored = otpStore.get(email);
    if (!stored) {
        return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    if (stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    try {
        // 2. Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // 3. For faculty, verify subject isn't already taken
        let finalName = name;
        let subjects = [];
        if (role === 'faculty') {
            const subjectTaken = await User.findOne({ role: 'faculty', department: department });
            if (subjectTaken) {
                return res.status(400).json({ success: false, message: `The subject '${department}' is already assigned to another faculty member.` });
            }
            subjects = [department]; // Faculty gets the subject they chose
        }

        // 4. Create User
        const user = await User.create({
            name: finalName, email, password, role, rollNo, department, subjects
        });

        // OTP is valid and user created — clean up
        otpStore.delete(email);

        // 5. Generate JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNo: user.rollNo,
                department: user.department,
                subjects: user.subjects
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNo: user.rollNo,
                department: user.department,
                subjects: user.subjects || []
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// ---- Assignment Routes ----

// POST /api/assignments (Create a new assignment)
app.post('/api/assignments', async (req, res) => {
    try {
        const { title, course, type, deadline, description, fileUrl, facultyId, facultyName } = req.body;
        
        if (!title || !course || !deadline) {
            return res.status(400).json({ success: false, message: 'Title, course, and deadline are required' });
        }

        const assignment = await Assignment.create({
            title, course, type, deadline, description, fileUrl, facultyId, facultyName
        });

        res.status(201).json({ success: true, message: 'Assignment created successfully', assignment });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ success: false, message: 'Server error creating assignment' });
    }
});

// GET /api/assignments (Fetch assignments — optionally filtered by facultyId)
app.get('/api/assignments', async (req, res) => {
    try {
        const filter = {};
        // If ?facultyId=xxx is provided, only return that faculty's assignments
        if (req.query.facultyId) {
            filter.facultyId = req.query.facultyId;
        }
        const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Fetch assignments error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching assignments' });
    }
});

// ==== [NEW OUTLINED ATTENDANCE ROUTES] ====

// GET /api/attendance/summary (For Student Dashboard)
app.get('/api/attendance/summary', async (req, res) => {
    try {
        const rollNo = req.query.rollNo;
        if (!rollNo) return res.status(400).json({ success: false, message: 'RollNo required' });

        const student = await StudentStats.findOne({ rollNo });
        if (!student) return res.status(404).json({ success: false, message: 'Student baseline not found' });

        const stats = student.attendanceStats || [];
        // Calculate percentages safely
        const formattedStats = stats.map(st => ({
            subject: st.subject,
            totalClasses: st.totalClasses,
            attendedClasses: st.attendedClasses,
            percent: st.totalClasses === 0 ? 0 : Math.round((st.attendedClasses / st.totalClasses) * 100)
        }));

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        console.error('Fetch student attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/attendance/faculty-stats (For Faculty Dashboard)
app.get('/api/attendance/faculty-stats', async (req, res) => {
    try {
        const subject = req.query.subject;
        if (!subject) return res.status(400).json({ success: false, message: 'Subject required' });

        const students = await StudentStats.find({}).select('name rollNo attendanceStats');
        
        let totalSum = 0;
        let validStudentsCount = 0;
        const studentDetails = [];

        for (const student of students) {
            const stat = (student.attendanceStats || []).find(s => s.subject === subject);
            if (stat && stat.totalClasses > 0) {
                const percent = Math.round((stat.attendedClasses / stat.totalClasses) * 100);
                totalSum += percent;
                validStudentsCount++;
                studentDetails.push({ name: student.name, rollNo: student.rollNo, percent, critical: percent < 75 ? 'Yes' : 'No' });
            } else {
                studentDetails.push({ name: student.name, rollNo: student.rollNo, percent: 100, critical: 'No (No classes yet)' });
            }
        }

        const averageAttendance = validStudentsCount === 0 ? 100 : Math.round(totalSum / validStudentsCount);
        
        // Filter out low attendance (<75%)
        const lowAttendance = studentDetails.filter(s => s.percent < 75);

        res.json({ success: true, averageAttendance, lowAttendance, allStudents: studentDetails });
    } catch (error) {
        console.error('Fetch faculty attendance stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/attendance (Faculty submits daily attendance)
app.post('/api/attendance', async (req, res) => {
    const { date, subject, facultyId, presentRollNos, absentRollNos } = req.body;
    
    if (!date || !subject || !facultyId || !presentRollNos || !absentRollNos) {
        return res.status(400).json({ success: false, message: 'Missing required attendance fields' });
    }

    try {
        const formattedDate = new Date(date).setHours(0,0,0,0); // Normalize to midnight

        // 1. Create the logical record (fails if this exact date and subject was already marked)
        const sessionDateObj = new Date(date);
        await AttendanceSession.create({
            date: sessionDateObj,
            subject,
            facultyId,
            presentRollNos,
            absentRollNos
        });

        // 2. Update StudentStats Documents (Bulk Update)
        
        // Helper: Format atomic updates so it increments only the matched subject inside the array, OR adds to array if absent
        const updateStudents = async (rollNos, attendedIncrement) => {
            if (!rollNos || rollNos.length === 0) return;

            for (const roll of rollNos) {
                // Check if this student already has the subject tracked
                const student = await StudentStats.findOne({ rollNo: roll, 'attendanceStats.subject': subject });

                if (student) {
                    await StudentStats.updateOne(
                        { rollNo: roll, 'attendanceStats.subject': subject },
                        { $inc: { 
                            'attendanceStats.$.totalClasses': 1,
                            'attendanceStats.$.attendedClasses': attendedIncrement 
                        }}
                    );
                } else {
                    // Push a brand new entry!
                    await StudentStats.updateOne(
                        { rollNo: roll },
                        { $push: { 
                            attendanceStats: { subject: subject, totalClasses: 1, attendedClasses: attendedIncrement } 
                        }}
                    );
                }
            }
        };

        // Increment present -> totalClasses+1, attendedClasses+1
        await updateStudents(presentRollNos, 1);
        
        // Increment absent -> totalClasses+1, attendedClasses+0
        await updateStudents(absentRollNos, 0);

        res.json({ success: true, message: 'Attendance marked successfully!' });

    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ success: false, message: 'Attendance for this subject has already been marked today.' });
        }
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error marking attendance' });
    }
});


// ---- Submission Routes ----

// POST /api/submissions
app.post('/api/submissions', upload.single('file'), async (req, res) => {
    try {
        const { assignmentId, studentId, studentName, link, notes } = req.body;
        
        if (!assignmentId || !studentId) {
            return res.status(400).json({ success: false, message: 'Assignment ID and Student ID are required' });
        }

        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const submission = await Submission.create({
            assignmentId, studentId, studentName, link, fileUrl, notes
        });

        res.status(201).json({ success: true, message: 'Assignment submitted successfully', submission });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ success: false, message: 'Server error submitting assignment' });
    }
});

// GET /api/submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const query = {};
        if (req.query.studentId) query.studentId = req.query.studentId;
        if (req.query.assignmentId) query.assignmentId = req.query.assignmentId;

        const submissions = await Submission.find(query);
        res.json({ success: true, submissions });
    } catch (error) {
        console.error('Fetch submissions error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching submissions' });
    }
});

// ---- Helper: Get all student emails from MongoDB ----
async function getAllStudentEmails() {
    const students = await User.find({ role: 'student' }, 'email name').lean();
    return students;
}

// ============================================================
//  📅  TIMETABLE CRUD ROUTES (MongoDB-backed)
// ============================================================

// GET /api/timetable — fetch the full weekly timetable
app.get('/api/timetable', async (req, res) => {
    try {
        let timetable = await Timetable.findOne();
        if (!timetable) {
            // Auto-seed if somehow missing
            timetable = await Timetable.create(DEFAULT_TIMETABLE);
        }
        res.json({ success: true, timetable });
    } catch (err) {
        console.error('Fetch timetable error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
});

// PUT /api/timetable/slot — update or add a single slot in a day
// Body: { day, time, subject, faculty, room }
app.put('/api/timetable/slot', async (req, res) => {
    try {
        const { day, time, subject, faculty, room } = req.body;
        if (!day || !time || !subject) {
            return res.status(400).json({ success: false, message: 'Day, time, and subject are required' });
        }

        let timetable = await Timetable.findOne();
        if (!timetable) {
            timetable = await Timetable.create(DEFAULT_TIMETABLE);
        }

        const daySlots = timetable[day];
        if (!daySlots) {
            return res.status(400).json({ success: false, message: `Invalid day: ${day}` });
        }

        // Find existing slot with matching time and replace, or add new
        const idx = daySlots.findIndex(s => s.time === time);
        if (idx >= 0) {
            daySlots[idx].subject = subject;
            daySlots[idx].faculty = faculty || '';
            daySlots[idx].room = room || '';
        } else {
            daySlots.push({ time, subject, faculty: faculty || '', room: room || '', isBreak: false });
            // Sort by time string after adding
            daySlots.sort((a, b) => a.time.localeCompare(b.time));
        }

        timetable.markModified(day);
        await timetable.save();

        console.log(`📅 Timetable updated: ${day} ${time} → ${subject} (${faculty})`);
        res.json({ success: true, message: 'Timetable slot updated', timetable });
    } catch (err) {
        console.error('Update timetable error:', err);
        res.status(500).json({ success: false, message: 'Failed to update timetable' });
    }
});

// ============================================================
//  📊  INTERNAL MARKS ROUTES (MongoDB-backed)
// ============================================================

// GET /api/internal-marks?subject=X  — load saved marks for a subject (faculty view)
app.get('/api/internal-marks', async (req, res) => {
    try {
        const { subject } = req.query;
        if (!subject) return res.status(400).json({ success: false, message: 'Subject is required' });
        const doc = await InternalMarks.findOne({ subject });
        res.json({ success: true, marks: doc ? doc.marks : [] });
    } catch (err) {
        console.error('Fetch internal marks error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/internal-marks/student/:rollNo  — all subjects' marks for one student
app.get('/api/internal-marks/student/:rollNo', async (req, res) => {
    try {
        const { rollNo } = req.params;
        const allDocs = await InternalMarks.find({});
        const result = allDocs.map(doc => {
            const m = (doc.marks || []).find(s => s.rollNo === rollNo);
            return {
                subject: doc.subject,
                ct1:             m ? m.ct1             : null,
                ct2:             m ? m.ct2             : null,
                assignmentMarks: m ? m.assignmentMarks : null,
                attendanceMarks: m ? m.attendanceMarks : null
            };
        });
        res.json({ success: true, marks: result });
    } catch (err) {
        console.error('Fetch student internal marks error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/internal-marks  — save/overwrite marks for a subject
// Body: { subject, facultyName, marks: [{rollNo, name, ct1, ct2, assignmentMarks, attendanceMarks}] }
app.post('/api/internal-marks', async (req, res) => {
    try {
        const { subject, facultyName, marks } = req.body;
        if (!subject || !Array.isArray(marks)) {
            return res.status(400).json({ success: false, message: 'subject and marks[] required' });
        }
        const doc = await InternalMarks.findOneAndUpdate(
            { subject },
            { subject, facultyName, marks },
            { upsert: true, new: true, runValidators: true }
        );
        console.log(`📊 Internal marks saved for: ${subject} (${marks.length} students)`);
        res.json({ success: true, message: 'Marks saved successfully', doc });
    } catch (err) {
        console.error('Save internal marks error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================================
//  📋  ANNOUNCEMENT CRUD ROUTES (MongoDB-backed)
// ============================================================

// GET /api/announcements — fetch all announcements (newest first)
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json({ success: true, announcements });
    } catch (err) {
        console.error('Fetch announcements error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
});

// ============================================================
//  📧  NOTIFICATION ROUTES
// ============================================================

// POST /api/notify/announcement
// Body: { title, message, priority, audience, facultyName }
app.post('/api/notify/announcement', async (req, res) => {
    try {
        const { title, message, priority = 'normal', audience = 'All Students', facultyName } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        // ---- Save to MongoDB so students can see it on their dashboard ----
        const saved = await Announcement.create({
            title, message, priority, audience, facultyName
        });
        console.log(`💾 Announcement saved to DB: "${title}" (id: ${saved._id})`);

        // ---- Email broadcast ----
        const students = await getAllStudentEmails();
        if (students.length === 0) {
            return res.json({ success: true, message: 'Saved. No registered students to notify.', sentCount: 0, announcement: saved });
        }

        const emails = students.map(s => s.email);
        const priorityLabels = { urgent: '🚨 URGENT', important: '⚠️ Important', normal: '📢 Announcement' };
        const subjectLine = `${priorityLabels[priority] || '📢'}: ${title}`;
        const html = announcementTemplate({ title, message, priority, audience, facultyName });

        const { sentCount, errors } = await sendBroadcast(transporter, emails, subjectLine, html);

        console.log(`📢 Announcement broadcast: "${title}" → ${sentCount} students`);
        res.json({
            success: true,
            message: `Announcement emailed to ${sentCount} student(s)`,
            sentCount,
            announcement: saved,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Announcement notify error:', err);
        res.status(500).json({ success: false, message: 'Failed to send announcement emails' });
    }
});

// POST /api/notify/assignment
// Body: { title, subject, description, dueDate, totalMarks, facultyName }
app.post('/api/notify/assignment', async (req, res) => {
    try {
        const { title, subject, description, dueDate, totalMarks, facultyName } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ success: false, message: 'Title and subject are required' });
        }

        const students = await getAllStudentEmails();
        if (students.length === 0) {
            return res.json({ success: true, message: 'No registered students to notify', sentCount: 0 });
        }

        const emails = students.map(s => s.email);
        const subjectLine = `📝 New Assignment: ${title} | ${subject}`;
        const html = assignmentTemplate({ title, subject, description, dueDate, totalMarks, facultyName });

        const { sentCount, errors } = await sendBroadcast(transporter, emails, subjectLine, html);

        console.log(`📝 Assignment broadcast: "${title}" → ${sentCount} students`);
        res.json({
            success: true,
            message: `Assignment notification sent to ${sentCount} student(s)`,
            sentCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Assignment notify error:', err);
        res.status(500).json({ success: false, message: 'Failed to send assignment emails' });
    }
});

// POST /api/notify/timetable
// Body: { day, time, subject, faculty, room, reason, changedBy }
app.post('/api/notify/timetable', async (req, res) => {
    try {
        const { day, time, subject, faculty, room, reason, changedBy } = req.body;
        if (!day || !time || !subject) {
            return res.status(400).json({ success: false, message: 'Day, time, and subject are required' });
        }

        // ---- Persist the timetable change to MongoDB ----
        let timetable = await Timetable.findOne();
        if (!timetable) {
            timetable = await Timetable.create(DEFAULT_TIMETABLE);
        }

        const daySlots = timetable[day];
        if (daySlots) {
            const idx = daySlots.findIndex(s => s.time === time);
            if (idx >= 0) {
                daySlots[idx].subject = subject;
                daySlots[idx].faculty = faculty || '';
                daySlots[idx].room = room || '';
            } else {
                daySlots.push({ time, subject, faculty: faculty || '', room: room || '', isBreak: false });
                daySlots.sort((a, b) => a.time.localeCompare(b.time));
            }
            timetable.markModified(day);
            await timetable.save();
            console.log(`📅 Timetable saved to DB: ${day} ${time} → ${subject}`);
        }

        // ---- Email broadcast ----
        const students = await getAllStudentEmails();
        if (students.length === 0) {
            return res.json({ success: true, message: 'Timetable updated. No students to notify.', sentCount: 0 });
        }

        const emails = students.map(s => s.email);
        const subjectLine = `📅 Timetable Change: ${subject} — ${day} ${time}`;
        const html = timetableTemplate({ day, time, subject, faculty, room, reason, changedBy });

        const { sentCount, errors } = await sendBroadcast(transporter, emails, subjectLine, html);

        console.log(`📅 Timetable broadcast: ${day} ${time} → ${sentCount} students`);
        res.json({
            success: true,
            message: `Timetable change notified to ${sentCount} student(s)`,
            sentCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Timetable notify error:', err);
        res.status(500).json({ success: false, message: 'Failed to send timetable emails' });
    }
});

// POST /api/notify/alert
// Body: { title, message, alertType, facultyName, targetEmails (optional array — omit to send to ALL students) }
app.post('/api/notify/alert', async (req, res) => {
    try {
        const { title, message, alertType = 'general', facultyName, targetEmails } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        let emails;
        if (targetEmails && Array.isArray(targetEmails) && targetEmails.length > 0) {
            // Send to specific students only
            emails = targetEmails;
        } else {
            // Broadcast to all registered students
            const students = await getAllStudentEmails();
            emails = students.map(s => s.email);
        }

        if (emails.length === 0) {
            return res.json({ success: true, message: 'No recipients found', sentCount: 0 });
        }

        const alertLabels = {
            low_attendance: '⚠️ Attendance Alert',
            exam:           '📋 Exam Notice',
            holiday:        '🎉 Holiday Notice',
            general:        '🔔 Notice'
        };
        const subjectLine = `${alertLabels[alertType] || '🔔'}: ${title}`;
        const html = alertTemplate({ title, message, alertType, facultyName });

        const { sentCount, errors } = await sendBroadcast(transporter, emails, subjectLine, html);

        console.log(`🔔 Alert broadcast: "${title}" → ${sentCount} recipient(s)`);
        res.json({
            success: true,
            message: `Alert sent to ${sentCount} recipient(s)`,
            sentCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Alert notify error:', err);
        res.status(500).json({ success: false, message: 'Failed to send alert emails' });
    }
});

// GET /api/notify/students-count — helpful to show faculty how many students will receive emails
app.get('/api/notify/students-count', async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'student' });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch student count' });
    }
});

// Fallback — serve index.html for any unmatched route
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---- Start Server ----
const http = require('http');
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`\n🚀 ClassHub server running at http://localhost:${PORT}`);
    console.log(`📂 Frontend served from: ${path.join(__dirname, '../frontend')}`);
    console.log(`📧 Email sender: ${process.env.EMAIL_USER}\n`);
});

// Keep process alive explicitly
setInterval(() => {}, 1000 * 60 * 60);
