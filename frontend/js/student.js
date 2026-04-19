/* ===== ClassHub Student Dashboard ===== */

// ---- Auth Guard ----
(function authGuard() {
    const token = localStorage.getItem('classhub_token');
    const user = JSON.parse(localStorage.getItem('classhub_user') || 'null');
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    // Populate header
    document.getElementById('user-name').textContent = user.name || 'Student';
    document.getElementById('user-role-label').textContent = user.rollNo ? `Roll: ${user.rollNo}` : 'Student • CSE 2nd Year';
    document.getElementById('user-avatar').textContent = (user.name || 'S').charAt(0).toUpperCase();
})();

function logout() {
    localStorage.removeItem('classhub_token');
    localStorage.removeItem('classhub_user');
    window.location.href = 'index.html';
}

// ---- Mock Data ----
const announcements = [
    { id: 1, title: 'Class Cancelled — Tomorrow', message: 'Data Structures lab scheduled for tomorrow is cancelled due to faculty medical leave. Make-up class will be scheduled next week.', priority: 'urgent', postedBy: 'Dr. Priya Singh', time: '2 hours ago', unread: true },
    { id: 2, title: 'Assignment Deadline Extended', message: 'DBMS Assignment submission deadline has been extended to April 25, 2026. Please ensure timely submission.', priority: 'important', postedBy: 'Prof. Amit Kumar', time: '1 day ago', unread: true },
    { id: 3, title: 'Industrial Visit Announcement', message: 'Industrial visit to TCS Lucknow scheduled for April 28. Registration mandatory. Contact CR for details.', priority: 'normal', postedBy: 'Class Representative', time: '2 days ago', unread: true },
    { id: 4, title: 'Library Books Due', message: 'Reminder: Library books issued in March are due for return by April 22. Late fees applicable after due date.', priority: 'normal', postedBy: 'Library Dept.', time: '3 days ago', unread: false },
    { id: 5, title: 'Timing Change — Next Week', message: 'From April 21, morning classes will start at 8:30 AM instead of 9:00 AM. Please be punctual.', priority: 'important', postedBy: 'HOD Office', time: '4 days ago', unread: false },
    { id: 6, title: 'Hackathon Registration Open', message: 'Annual college hackathon registration is now open. Team size: 3-4 members. Last date: April 26. Prize worth ₹50,000.', priority: 'normal', postedBy: 'Tech Club', time: '5 days ago', unread: false }
];

let assignments = []; // dynamically fetched from MongoDB
const API_BASE = 'http://localhost:5001';

const timetableData = {
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

const attendanceData = [
    { subject: 'Data Structures', percent: 92 },
    { subject: 'Database Management', percent: 88 },
    { subject: 'Operating Systems', percent: 85 },
    { subject: 'Computer Networks', percent: 90 },
    { subject: 'Software Engineering', percent: 78 },
    { subject: 'Mathematics-III', percent: 94 }
];

// ---- Tab Switching ----
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById(tabName);
    if (tab) tab.classList.add('active');

    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => {
        const onclick = b.getAttribute('onclick');
        return onclick && onclick.includes(`'${tabName}'`);
    });
    if (btn) btn.classList.add('active');

    // Lazy init charts
    if (tabName === 'analytics') initCharts();
}

// ---- Modal Helpers ----
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const m = document.querySelector('.modal.active');
        if (m) m.classList.remove('active');
    }
});

// ---- API Functions ----

async function fetchAssignments() {
    try {
        const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
        
        // 1. Fetch all assignments
        const asgRes = await fetch(`${API_BASE}/api/assignments`);
        const asgData = await asgRes.json();
        
        // 2. Fetch submissions for current student
        const subRes = await fetch(`${API_BASE}/api/submissions?studentId=${user.id}`);
        const subData = await subRes.json();
        
        const submittedAssignmentIds = new Set();
        if (subData.success) {
            subData.submissions.forEach(s => submittedAssignmentIds.add(s.assignmentId));
        }

        if (asgData.success) {
            assignments = asgData.assignments.map(a => {
                const isSubmitted = submittedAssignmentIds.has(a._id);
                return {
                    id: a._id,
                    title: a.title,
                    subject: a.course,
                    faculty: a.facultyName || 'Faculty',
                    description: a.description,
                    dueDate: a.deadline,
                    submitted: isSubmitted,
                    status: isSubmitted ? 'completed' : 'pending'
                };
            });
            
            // Re-render UI components dependent on assignments
            renderUpcomingDeadlines();
            renderAllAssignments();
            updateStats();
        }
    } catch (err) {
        console.error('Failed to fetch assignments', err);
        showToast('Error loading assignments from server', 'error');
    }
}

// ---- Render Functions ----

function renderTodaySchedule() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const slots = timetableData[today] || timetableData['Monday']; // Fallback to Monday
    const container = document.getElementById('today-schedule');

    container.innerHTML = slots.map(slot => `
        <div class="timetable-slot ${slot.isBreak ? 'break-slot' : ''}">
            <div class="slot-time">${slot.time}</div>
            <div class="slot-details">
                <div class="slot-subject">${slot.subject}</div>
                ${slot.faculty ? `<div class="slot-faculty">${slot.faculty} <span class="slot-room">${slot.room}</span></div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderRecentAnnouncements() {
    const container = document.getElementById('recent-announcements');
    const recent = announcements.slice(0, 3);
    container.innerHTML = recent.map(a => renderAnnouncementItem(a)).join('');
}

function renderAllAnnouncements() {
    const container = document.getElementById('all-announcements');
    container.innerHTML = announcements.map(a => renderAnnouncementItem(a)).join('');
}

function renderAnnouncementItem(a) {
    const icons = { urgent: '🚨', important: '⚠️', normal: '📢' };
    const priorityClass = `priority-${a.priority}`;
    return `
        <div class="notification-item ${a.unread ? 'unread' : ''}">
            <div class="notification-content">
                <h4>${icons[a.priority] || '📢'} ${a.title} <span class="notification-priority ${priorityClass}">${a.priority}</span></h4>
                <p>${a.message}</p>
                <div class="notification-time">Posted by ${a.postedBy} — ${a.time}</div>
            </div>
        </div>
    `;
}

function renderUpcomingDeadlines() {
    const container = document.getElementById('upcoming-deadlines');
    const pending = assignments.filter(a => !a.submitted).slice(0, 3);
    container.innerHTML = pending.map(a => `
        <div class="assignment-card">
            <div class="assignment-header">
                <div>
                    <div class="assignment-title">${a.title}</div>
                    <div class="assignment-subject">${a.subject}</div>
                </div>
                <div class="assignment-due">Due: ${a.dueDate}</div>
            </div>
        </div>
    `).join('');
}

function renderAllAssignments() {
    const container = document.getElementById('all-assignments');
    container.innerHTML = assignments.map(a => {
        const statusBadge = a.submitted
            ? `<span class="badge badge-success">✅ Submitted${a.grade ? ' — Grade: ' + a.grade : ''}</span>`
            : `<span class="badge badge-warning">⏳ Pending</span>`;
        const actionBtn = a.submitted
            ? ''
            : `<button class="btn btn-primary btn-sm" onclick="openSubmitModal('${a.id}')">Submit →</button>`;
        return `
            <div class="assignment-card">
                <div class="assignment-header">
                    <div>
                        <div class="assignment-title">${a.title}</div>
                        <div class="assignment-subject">${a.subject} — ${a.faculty}</div>
                    </div>
                    <div class="assignment-due ${a.submitted ? 'completed' : ''}">${a.submitted ? 'Completed' : 'Due: ' + a.dueDate}</div>
                </div>
                <div class="assignment-description">${a.description}</div>
                <div class="assignment-footer">
                    <div>${statusBadge}</div>
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

function renderFullTimetable() {
    const container = document.getElementById('full-timetable');
    let html = '';
    for (const [day, slots] of Object.entries(timetableData)) {
        html += `<div class="timetable-day">${day}</div>`;
        html += slots.map(slot => `
            <div class="timetable-slot ${slot.isBreak ? 'break-slot' : ''}">
                <div class="slot-time">${slot.time}</div>
                <div class="slot-details">
                    <div class="slot-subject">${slot.subject}</div>
                    ${slot.faculty ? `<div class="slot-faculty">${slot.faculty} <span class="slot-room">${slot.room}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }
    container.innerHTML = html;
}

function renderAttendanceBreakdown() {
    const container = document.getElementById('attendance-breakdown');
    container.innerHTML = attendanceData.map(a => {
        const colorClass = a.percent >= 85 ? '' : a.percent >= 75 ? 'warning' : 'danger';
        const textColor = a.percent >= 85 ? 'var(--success-light)' : a.percent >= 75 ? 'var(--warning)' : 'var(--danger-light)';
        return `
            <div class="progress-container">
                <div class="progress-header">
                    <span class="subject-name">${a.subject}</span>
                    <span class="percent" style="color: ${textColor}">${a.percent}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width: ${a.percent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    const pending = assignments.filter(a => !a.submitted).length;
    const avg = Math.round(attendanceData.reduce((s, a) => s + a.percent, 0) / attendanceData.length);
    const unread = announcements.filter(a => a.unread).length;

    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-attendance').textContent = avg + '%';
    document.getElementById('stat-announcements').textContent = unread;

    const badge = document.getElementById('announcement-badge');
    if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'inline-block';
    }
}

// ---- Assignment Submission ----
let currentSubmitId = null;
let selectedFile = null;

function openSubmitModal(id) {
    currentSubmitId = id;
    selectedFile = null;
    clearFile();
    
    const a = assignments.find(x => x.id === id);
    if (!a) return;
    document.getElementById('submit-assignment-title').value = a.title + ' (' + a.subject + ')';
    document.getElementById('submission-link').value = '';
    document.getElementById('submission-notes').value = '';
    openModal('submitAssignmentModal');
}

// Drag & Drop Functionality
function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            selectedFile = file;
            document.querySelector('.drop-zone-content').style.display = 'none';
            document.getElementById('file-display').style.display = 'block';
            document.getElementById('file-name-display').textContent = file.name;
        } else {
            showToast('Please upload a PDF file only', 'warning');
        }
    }
}

function clearFile() {
    selectedFile = null;
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    
    const dropZoneContent = document.querySelector('.drop-zone-content');
    const fileDisplay = document.getElementById('file-display');
    
    if (dropZoneContent) dropZoneContent.style.display = 'block';
    if (fileDisplay) fileDisplay.style.display = 'none';
}

async function submitAssignment(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const link = document.getElementById('submission-link').value;
    const notes = document.getElementById('submission-notes').value;

    if (!selectedFile && !link) {
        showToast('Please upload a PDF or provide a link', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        const formData = new FormData();
        formData.append('assignmentId', currentSubmitId);
        formData.append('studentId', user.id);
        formData.append('studentName', user.name);
        formData.append('link', link);
        formData.append('notes', notes);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        const res = await fetch(`${API_BASE}/api/submissions`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Assignment';
        }

        if (data.success) {
            closeModal('submitAssignmentModal');
            showToast('Assignment submitted successfully!', 'success');
            await fetchAssignments(); // Re-fetch to update status flags globally
        } else {
            showToast(data.message || 'Error submitting assignment', 'error');
        }
    } catch (err) {
        console.error('Submit error:', err);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Assignment';
        }
        showToast('Network error while submitting', 'error');
    }
}

// ---- Charts ----
let chartsInitialized = false;

function initCharts() {
    if (chartsInitialized) return;
    chartsInitialized = true;

    // Attendance Chart
    const attCtx = document.getElementById('attendance-chart').getContext('2d');
    new Chart(attCtx, {
        type: 'bar',
        data: {
            labels: attendanceData.map(a => a.subject),
            datasets: [{
                label: 'Attendance %',
                data: attendanceData.map(a => a.percent),
                backgroundColor: attendanceData.map(a =>
                    a.percent >= 85 ? 'rgba(16,185,129,0.7)' :
                    a.percent >= 75 ? 'rgba(245,158,11,0.7)' :
                    'rgba(239,68,68,0.7)'
                ),
                borderColor: attendanceData.map(a =>
                    a.percent >= 85 ? '#10b981' :
                    a.percent >= 75 ? '#f59e0b' :
                    '#ef4444'
                ),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }
                }
            }
        }
    });

    // Assignment Progress Doughnut
    const submitted = assignments.filter(a => a.submitted).length;
    const pending = assignments.filter(a => !a.submitted).length;
    const asgCtx = document.getElementById('assignments-chart').getContext('2d');
    new Chart(asgCtx, {
        type: 'doughnut',
        data: {
            labels: ['Submitted', 'Pending'],
            datasets: [{
                data: [submitted, pending],
                backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)'],
                borderColor: ['#10b981', '#f59e0b'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 20, font: { size: 13 } }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            }
        }
    });
}

// ---- Toast ----
function showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', function () {
    updateStats();
    renderTodaySchedule();
    renderRecentAnnouncements();
    renderUpcomingDeadlines();
    renderAllAnnouncements();
    renderAllAssignments();
    renderFullTimetable();
    renderAttendanceBreakdown();
    
    setupDropZone();
    
    // Fetch from MongoDB
    fetchAssignments();
});
