/* ===== ClassHub Backend — Express + Nodemailer OTP Server ===== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Assignment = require('./models/Assignment');

const app = express();
const PORT = process.env.PORT || 5001;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- MongoDB Connection ----
mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ---- In-memory OTP store (for demo; use MongoDB/Redis in production) ----
const otpStore = new Map(); // email -> { otp, expiresAt }

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

        // 3. Create User
        const user = await User.create({
            name, email, password, role, rollNo, department
        });

        // OTP is valid and user created — clean up
        otpStore.delete(email);

        // 4. Generate JWT
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
                department: user.department
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
                department: user.department
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

// GET /api/assignments (Fetch all assignments)
app.get('/api/assignments', async (req, res) => {
    try {
        const assignments = await Assignment.find().sort({ createdAt: -1 });
        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Fetch assignments error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching assignments' });
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
