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

const assignments = [
    { id: 1, title: 'Operating Systems Mini Project', subject: 'Operating Systems', faculty: 'Dr. Rajesh Verma', description: 'Implement a process scheduling simulator using C/C++. Must include FCFS, SJF, and Round Robin algorithms. Submit code with documentation.', dueDate: 'Apr 22, 2026', submitted: false, status: 'pending' },
    { id: 2, title: 'Database Design Project', subject: 'DBMS', faculty: 'Prof. Amit Kumar', description: 'Design a complete database for a library management system. Include ER diagram, normalization up to 3NF, and SQL queries.', dueDate: 'Apr 25, 2026', submitted: false, status: 'pending' },
    { id: 3, title: 'Binary Search Tree Implementation', subject: 'Data Structures', faculty: 'Dr. Priya Singh', description: 'Implement BST with insertion, deletion, and all traversal methods. Include time complexity analysis.', dueDate: 'Apr 15, 2026', submitted: true, status: 'completed', grade: 'A' },
    { id: 4, title: 'Software Engineering Case Study', subject: 'Software Engineering', faculty: 'Dr. Neha Gupta', description: 'Analyze a real-world software project failure. Create SRS document, identify issues, and propose solutions.', dueDate: 'Apr 28, 2026', submitted: false, status: 'pending' },
    { id: 5, title: 'Computer Networks Lab Report', subject: 'Computer Networks', faculty: 'Prof. Suresh Patel', description: 'Submit lab report covering socket programming experiments. Include code, output screenshots, and performance analysis.', dueDate: 'Apr 30, 2026', submitted: false, status: 'pending' }
];

const timetableData = {
    Monday: [
        { time: '09:00 - 09:50', subject: 'Data Structures', faculty: 'Dr. Priya Singh', room: 'Room 301' },
        { time: '10:00 - 10:50', subject: 'Database Management', faculty: 'Prof. Amit Kumar', room: 'Room 205' },
        { time: '11:00 - 11:50', subject: 'Operating Systems', faculty: 'Dr. Rajesh Verma', room: 'Room 302' },
        { time: '12:00 - 12:50', subject: 'Software Engineering', faculty: 'Dr. Neha Gupta', room: 'Room 201' },
        { time: '12:50 - 01:40', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '01:40 - 03:30', subject: 'DBMS Lab', faculty: 'Prof. Amit Kumar', room: 'Lab 2' }
    ],
    Tuesday: [
        { time: '09:00 - 09:50', subject: 'Computer Networks', faculty: 'Prof. Suresh Patel', room: 'Room 303' },
        { time: '10:00 - 10:50', subject: 'Operating Systems', faculty: 'Dr. Rajesh Verma', room: 'Room 302' },
        { time: '11:00 - 11:50', subject: 'Data Structures', faculty: 'Dr. Priya Singh', room: 'Room 301' },
        { time: '12:00 - 12:50', subject: 'Mathematics-III', faculty: 'Prof. Anita Sharma', room: 'Room 104' },
        { time: '12:50 - 01:40', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '01:40 - 03:30', subject: 'Data Structures Lab', faculty: 'Dr. Priya Singh', room: 'Lab 1' }
    ],
    Wednesday: [
        { time: '09:00 - 09:50', subject: 'Software Engineering', faculty: 'Dr. Neha Gupta', room: 'Room 201' },
        { time: '10:00 - 10:50', subject: 'Database Management', faculty: 'Prof. Amit Kumar', room: 'Room 205' },
        { time: '11:00 - 11:50', subject: 'Computer Networks', faculty: 'Prof. Suresh Patel', room: 'Room 303' },
        { time: '12:00 - 12:50', subject: 'Operating Systems', faculty: 'Dr. Rajesh Verma', room: 'Room 302' },
        { time: '12:50 - 01:40', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '01:40 - 03:30', subject: 'OS Lab', faculty: 'Dr. Rajesh Verma', room: 'Lab 3' }
    ],
    Thursday: [
        { time: '09:00 - 09:50', subject: 'Mathematics-III', faculty: 'Prof. Anita Sharma', room: 'Room 104' },
        { time: '10:00 - 10:50', subject: 'Data Structures', faculty: 'Dr. Priya Singh', room: 'Room 301' },
        { time: '11:00 - 11:50', subject: 'Software Engineering', faculty: 'Dr. Neha Gupta', room: 'Room 201' },
        { time: '12:00 - 12:50', subject: 'Database Management', faculty: 'Prof. Amit Kumar', room: 'Room 205' },
        { time: '12:50 - 01:40', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '01:40 - 03:30', subject: 'Computer Networks Lab', faculty: 'Prof. Suresh Patel', room: 'Lab 4' }
    ],
    Friday: [
        { time: '09:00 - 09:50', subject: 'Operating Systems', faculty: 'Dr. Rajesh Verma', room: 'Room 302' },
        { time: '10:00 - 10:50', subject: 'Computer Networks', faculty: 'Prof. Suresh Patel', room: 'Room 303' },
        { time: '11:00 - 11:50', subject: 'Mathematics-III', faculty: 'Prof. Anita Sharma', room: 'Room 104' },
        { time: '12:00 - 12:50', subject: 'Technical Communication', faculty: 'Prof. Kavita Rao', room: 'Room 102' },
        { time: '12:50 - 01:40', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '01:40 - 03:30', subject: 'Software Engineering Lab', faculty: 'Dr. Neha Gupta', room: 'Lab 2' }
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
            : `<button class="btn btn-primary btn-sm" onclick="openSubmitModal(${a.id})">Submit →</button>`;
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

function openSubmitModal(id) {
    currentSubmitId = id;
    const a = assignments.find(x => x.id === id);
    if (!a) return;
    document.getElementById('submit-assignment-title').value = a.title + ' (' + a.subject + ')';
    document.getElementById('submission-link').value = '';
    document.getElementById('submission-notes').value = '';
    openModal('submitAssignmentModal');
}

function submitAssignment(e) {
    e.preventDefault();
    const a = assignments.find(x => x.id === currentSubmitId);
    if (a) {
        a.submitted = true;
        a.status = 'completed';
    }
    closeModal('submitAssignmentModal');
    renderAllAssignments();
    renderUpcomingDeadlines();
    updateStats();
    showToast('Assignment submitted successfully!', 'success');
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
});
