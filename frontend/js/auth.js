/* ===== ClassHub Auth Module ===== */

// ---- Config ----
const API_BASE = 'http://localhost:5001';

// ---- State ----
let authMode = 'login';
let selectedRole = 'student';
let captchaCode = '';
let otpSent = false;

// ---- Auth Mode Toggle ----
function switchAuthMode(mode) {
    authMode = mode;
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleLogin = document.getElementById('toggle-login');
    const toggleSignup = document.getElementById('toggle-signup');
    const heading = document.getElementById('auth-heading');
    const description = document.getElementById('auth-description');
    const roleSelector = document.getElementById('role-selector');

    if (mode === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        toggleLogin.classList.add('active');
        toggleSignup.classList.remove('active');
        heading.textContent = 'Welcome Back';
        description.textContent = 'Sign in to continue to your dashboard';
        roleSelector.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        toggleLogin.classList.remove('active');
        toggleSignup.classList.add('active');
        heading.textContent = 'Create Account';
        description.textContent = 'Join ClassHub to streamline your classroom';
        roleSelector.style.display = 'flex';
        generateCaptcha();
        resetOtpState();
    }
}

// ---- Role Selector ----
function selectRole(role) {
    selectedRole = role;
    const studentEl = document.getElementById('role-student');
    const facultyEl = document.getElementById('role-faculty');
    const rollGroup = document.getElementById('signup-roll-group');
    const deptGroup = document.getElementById('signup-dept-group');

    studentEl.classList.toggle('active', role === 'student');
    facultyEl.classList.toggle('active', role === 'faculty');

    if (role === 'student') {
        rollGroup.style.display = 'block';
        deptGroup.style.display = 'none';
    } else {
        rollGroup.style.display = 'none';
        deptGroup.style.display = 'block';
    }
}

// ---- CAPTCHA ----
function generateCaptcha() {
    const canvas = document.getElementById('captcha-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    captchaCode = '';
    for (let i = 0; i < 5; i++) {
        captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 140, 44);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 140, 44);

    // Noise lines
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(${100 + Math.random()*100}, ${100 + Math.random()*100}, ${200 + Math.random()*55}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 140, Math.random() * 44);
        ctx.lineTo(Math.random() * 140, Math.random() * 44);
        ctx.stroke();
    }

    // Characters
    ctx.font = 'bold 22px DM Sans, monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < captchaCode.length; i++) {
        const hue = 220 + Math.random() * 120;
        ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
        ctx.save();
        ctx.translate(18 + i * 22, 22 + (Math.random() - 0.5) * 8);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillText(captchaCode[i], 0, 0);
        ctx.restore();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
        ctx.fillRect(Math.random() * 140, Math.random() * 44, 2, 2);
    }

    const input = document.getElementById('captcha-input');
    if (input) input.value = '';
}

// ---- OTP ----
async function sendOtp() {
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const captchaInput = document.getElementById('captcha-input').value.trim();

    if (!name) return showToast('Please enter your name', 'error');
    if (!email) return showToast('Please enter your email', 'error');
    if (!password || password.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
        generateCaptcha();
        return showToast('CAPTCHA is incorrect. Try again.', 'error');
    }

    // Disable button while sending
    const sendBtn = document.getElementById('send-otp-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

    try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send OTP';
            return showToast(data.message || 'Failed to send OTP', 'error');
        }

        otpSent = true;
        document.getElementById('otp-section').style.display = 'block';
        document.getElementById('captcha-group').style.display = 'none';
        sendBtn.style.display = 'none';
        document.getElementById('signup-btn').style.display = 'flex';

        showToast(`OTP sent to ${email}! Check your inbox.`, 'success');

        // Auto-focus first OTP input
        const otpInputs = document.querySelectorAll('#otp-inputs input');
        if (otpInputs[0]) otpInputs[0].focus();
    } catch (err) {
        console.error('Send OTP error:', err);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP';
        showToast('Network error. Is the server running?', 'error');
    }
}

async function resendOtp() {
    const email = document.getElementById('signup-email').value.trim();
    const resendBtn = document.getElementById('resend-otp');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending…';

    try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.success) {
            showToast('New OTP sent! Check your inbox.', 'success');
        } else {
            showToast(data.message || 'Failed to resend OTP', 'error');
        }
    } catch (err) {
        showToast('Network error. Is the server running?', 'error');
    }

    resendBtn.disabled = false;
    resendBtn.textContent = 'Resend Code';
}

function resetOtpState() {
    otpSent = false;
    generatedOtp = '';
    const otpSection = document.getElementById('otp-section');
    const captchaGroup = document.getElementById('captcha-group');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const signupBtn = document.getElementById('signup-btn');

    if (otpSection) otpSection.style.display = 'none';
    if (captchaGroup) captchaGroup.style.display = 'block';
    if (sendOtpBtn) sendOtpBtn.style.display = 'flex';
    if (signupBtn) signupBtn.style.display = 'none';

    // Clear OTP inputs
    document.querySelectorAll('#otp-inputs input').forEach(i => (i.value = ''));
}

// ---- OTP Input Auto-advance ----
document.addEventListener('DOMContentLoaded', function () {
    const otpInputs = document.querySelectorAll('#otp-inputs input');
    otpInputs.forEach((input, idx) => {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value && idx < otpInputs.length - 1) {
                otpInputs[idx + 1].focus();
            }
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !this.value && idx > 0) {
                otpInputs[idx - 1].focus();
            }
        });
        input.addEventListener('paste', function (e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            for (let i = 0; i < Math.min(paste.length, otpInputs.length - idx); i++) {
                otpInputs[idx + i].value = paste[i];
            }
            const nextIdx = Math.min(idx + paste.length, otpInputs.length - 1);
            otpInputs[nextIdx].focus();
        });
    });

    generateCaptcha();
});

// ---- Login Handler ----
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return showToast('Please fill in all fields', 'error');

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In…';
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }

        if (!res.ok || !data.success) {
            return showToast(data.message || 'Invalid credentials', 'error');
        }

        // Save real JWT token and DB user to localStorage
        localStorage.setItem('classhub_token', data.token);
        localStorage.setItem('classhub_user', JSON.stringify(data.user));

        showToast('Login successful! Redirecting…', 'success');
        setTimeout(() => {
            window.location.href = data.user.role === 'faculty' ? 'faculty.html' : 'student.html';
        }, 800);

    } catch (err) {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
        showToast('Network error. Is the server running?', 'error');
    }
}

// ---- Signup Handler ----
async function handleSignup(e) {
    e.preventDefault();

    if (!otpSent) return showToast('Please send OTP first', 'error');

    // Collect OTP
    const otpInputs = document.querySelectorAll('#otp-inputs input');
    const enteredOtp = Array.from(otpInputs).map(i => i.value).join('');

    if (enteredOtp.length !== 6) {
        return showToast('Please enter the full 6-digit OTP', 'error');
    }

    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value;
    const rollNo = selectedRole === 'student' ? document.getElementById('signup-roll').value.trim() : null;
    const department = selectedRole === 'faculty' ? document.getElementById('signup-dept').value.trim() : null;

    // Verify OTP and create account with backend
    const signupBtn = document.getElementById('signup-btn');
    signupBtn.disabled = true;
    signupBtn.textContent = 'Verifying & Creating Account…';

    try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, email, password, role: selectedRole, rollNo, department, otp: enteredOtp 
            })
        });
        const data = await res.json();

        signupBtn.disabled = false;
        signupBtn.textContent = 'Create Account';

        if (!res.ok || !data.success) {
            return showToast(data.message || 'Signup failed', 'error');
        }

        // Save real JWT token to local storage
        localStorage.setItem('classhub_token', data.token);
        localStorage.setItem('classhub_user', JSON.stringify(data.user));

        showToast('Account created! Redirecting…', 'success');
        setTimeout(() => {
            window.location.href = data.user.role === 'faculty' ? 'faculty.html' : 'student.html';
        }, 800);

    } catch (err) {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Create Account';
        return showToast('Network error. Is the server running?', 'error');
    }
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3200);
}
