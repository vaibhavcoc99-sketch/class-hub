/* ===== ClassHub Faculty Dashboard ===== */

// ---- Auth Guard ----
(function authGuard() {
    const token = localStorage.getItem('classhub_token');
    const user = JSON.parse(localStorage.getItem('classhub_user') || 'null');
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('user-name').textContent = user.name || 'Faculty';
    document.getElementById('user-role-label').textContent = user.department ? user.department : 'Faculty • CSE Department';
    document.getElementById('user-avatar').textContent = (user.name || 'F').charAt(0).toUpperCase();
})();

function logout() {
    localStorage.removeItem('classhub_token');
    localStorage.removeItem('classhub_user');
    window.location.href = 'index.html';
}

// ---- Mock Data ----
const facultyAnnouncements = [];

let facultyAssignments = []; // dynamically fetched from MongoDB
const API_BASE = 'http://localhost:5001';

const timetableData = {
    Monday: [
        { time: '09:10 - 10:50', subject: 'Mini Project', faculty: 'Abhishek Nagar', room: 'Lt 21' },
        { time: '10:50 - 11:40', subject: 'Technical Communication', faculty: 'Dr. Pragati Shukla', room: 'Lt 21' },
        { time: '11:40 - 12:30', subject: 'Sensor & Instrumentation', faculty: 'Prof. Adeeb', room: 'EED201' },
        { time: '12:30 - 02:00', subject: '🍽️ LUNCH BREAK', faculty: '', room: '', isBreak: true },
        { time: '02:00 - 03:40', subject: 'Operating System', faculty: 'Ass. Dipanshu Singh', room: 'Lt 21' },
        { time: '03:40 - 04:30', subject: 'Ethical Research', faculty: 'Prof.Kajal', room: 'Lt 21' }
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
    { subject: 'Operating System', percent: 92 },
    { subject: 'OOps using JAVA', percent: 88 },
    { subject: 'Automata', percent: 85 },
    { subject: 'Python', percent: 90 },
    { subject: 'Ethical Research', percent: 78 },
    { subject: 'Sensor & Instrumentation', percent: 94 }
];

const lowAttendanceStudents = [];

const mockStudents = GLOBAL_STUDENT_LIST;

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
        const res = await fetch(`${API_BASE}/api/assignments`);
        const data = await res.json();
        if (data.success) {
            facultyAssignments = data.assignments.map(a => ({
                id: a._id,
                title: a.title,
                subject: a.course,
                description: a.description,
                dueDate: a.deadline,
                totalMarks: 100, // mock mapping
                submissions: Math.floor(Math.random() * 5), // mock
                total: 60, // mock
                status: 'active'
            }));
            renderFacultyAssignments();
            updateStats();
        }
    } catch (err) {
        console.error('Failed to load assignments', err);
        showToast('Error loading assignments from server', 'error');
    }
}

// ---- Render Functions ----

function renderRecentActivity() {
    const activities = [
        { icon: '📢', text: 'You posted "Class Cancelled — Tomorrow"', time: '2 hours ago' },
        { icon: '📝', text: '15 students submitted OS Mini Project', time: '5 hours ago' },
        { icon: '✅', text: 'Marked attendance for Data Structures', time: 'Yesterday' },
        { icon: '📊', text: 'Graded 60 submissions for BST Implementation', time: '2 days ago' },
        { icon: '📢', text: 'You posted "Mid-Semester Results Published"', time: '3 days ago' }
    ];

    const container = document.getElementById('recent-activity');
    container.innerHTML = activities.map(a => `
        <div class="notification-item">
            <div class="notification-content">
                <h4>${a.icon} ${a.text}</h4>
                <div class="notification-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function renderFacultyAnnouncements() {
    const container = document.getElementById('faculty-announcements');
    const icons = { urgent: '🚨', important: '⚠️', normal: '📢' };
    container.innerHTML = facultyAnnouncements.map(a => `
        <div class="notification-item">
            <div class="notification-content">
                <h4>${icons[a.priority] || '📢'} ${a.title} <span class="notification-priority priority-${a.priority}">${a.priority}</span></h4>
                <p>${a.message}</p>
                <div class="notification-time">Audience: ${a.audience} — ${a.time}</div>
            </div>
        </div>
    `).join('');
}

function renderFacultyAssignments() {
    const container = document.getElementById('faculty-assignments');
    container.innerHTML = facultyAssignments.map(a => {
        const isComplete = a.status === 'completed';
        const progressPercent = Math.round((a.submissions / a.total) * 100);
        return `
            <div class="assignment-card">
                <div class="assignment-header">
                    <div>
                        <div class="assignment-title">${a.title}</div>
                        <div class="assignment-subject">${a.subject} • Total Marks: ${a.totalMarks}</div>
                    </div>
                    <div class="assignment-due ${isComplete ? 'completed' : ''}">${isComplete ? 'Completed' : 'Due: ' + a.dueDate}</div>
                </div>
                <div class="assignment-description">${a.description}</div>
                <div style="margin-bottom: 14px;">
                    <div class="progress-header">
                        <span class="subject-name" style="font-size: 0.82rem;">Submissions</span>
                        <span class="percent" style="font-size: 0.82rem; color: var(--text-secondary);">${a.submissions}/${a.total}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="assignment-footer">
                    <span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}">${isComplete ? '✅ All Submitted' : '⏳ ' + (a.total - a.submissions) + ' Pending'}</span>
                    <button class="btn btn-primary btn-sm" onclick="openGradeModal(${a.id})">Grade Submissions</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderFacultyTimetable() {
    const container = document.getElementById('faculty-timetable');
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

function renderAttendanceProgress() {
    const container = document.getElementById('attendance-progress');
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

function renderLowAttendance() {
    const container = document.getElementById('low-attendance-body');
    container.innerHTML = lowAttendanceStudents.map(s => `
        <tr>
            <td>${s.rollNo}</td>
            <td>${s.name}</td>
            <td><span class="badge badge-danger">${s.percent}%</span></td>
            <td>${s.critical}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="sendAlert('${s.name}')">Send Alert</button></td>
        </tr>
    `).join('');
}

function renderAttendanceMarking() {
    const container = document.getElementById('attendance-marking-body');
    container.innerHTML = mockStudents.map(s => `
        <tr>
            <td>${s.rollNo}</td>
            <td>${s.name}</td>
            <td>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: var(--success); cursor: pointer;">
                    <span class="badge badge-success" style="font-size: 0.75rem;">Present</span>
                </label>
            </td>
        </tr>
    `).join('');

    // Toggle badge text on checkbox change
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const badge = this.nextElementSibling;
            if (this.checked) {
                badge.className = 'badge badge-success';
                badge.textContent = 'Present';
                badge.style.fontSize = '0.75rem';
            } else {
                badge.className = 'badge badge-danger';
                badge.textContent = 'Absent';
                badge.style.fontSize = '0.75rem';
            }
        });
    });
}

function updateStats() {
    const active = facultyAssignments.filter(a => a.status === 'active').length;
    const avg = Math.round(attendanceData.reduce((s, a) => s + a.percent, 0) / attendanceData.length);
    document.getElementById('stat-active-assignments').textContent = active;
    document.getElementById('stat-avg-attendance').textContent = avg + '%';
    document.getElementById('stat-announcements-count').textContent = facultyAnnouncements.length;
}

// ---- Actions ----

function postAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const message = document.getElementById('ann-message').value.trim();
    const priority = document.getElementById('ann-priority').value;
    const audience = document.getElementById('ann-audience').value;

    facultyAnnouncements.unshift({
        id: Date.now(),
        title,
        message,
        priority,
        audience: audience === 'all' ? 'All Students' : audience === 'cse' ? 'CSE Department' : 'Specific Section',
        time: 'Just now'
    });

    closeModal('postAnnouncementModal');
    e.target.reset();
    renderFacultyAnnouncements();
    updateStats();
    showToast('Announcement posted successfully!', 'success');
}

async function createAssignment(e) {
    e.preventDefault();
    const title = document.getElementById('asg-title').value.trim();
    const subject = document.getElementById('asg-subject').value;
    const description = document.getElementById('asg-description').value.trim();
    const dueDate = document.getElementById('asg-due').value;
    const totalMarks = parseInt(document.getElementById('asg-marks').value) || 100;

    const dateObj = new Date(dueDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');

    try {
        const res = await fetch(`${API_BASE}/api/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                course: subject,
                type: 'Assignment',
                deadline: formattedDate,
                description,
                facultyId: user.id || null,
                facultyName: user.name || 'Faculty'
            })
        });

        const data = await res.json();
        if (data.success) {
            closeModal('createAssignmentModal');
            e.target.reset();
            showToast('Assignment created successfully in MongoDB!', 'success');
            await fetchAssignments(); // refresh list
        } else {
            showToast('Error saving assignment', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error while saving assignment', 'error');
    }
}

function updateTimetable(e) {
    e.preventDefault();
    closeModal('editTimetableModal');
    e.target.reset();
    showToast('Timetable updated successfully!', 'success');
}

async function openGradeModal(assignmentId) {
    const a = facultyAssignments.find(x => x.id === assignmentId);
    if (!a) return;

    document.getElementById('grade-assignment-label').textContent = `${a.title} (${a.subject})`;
    const body = document.getElementById('grade-submissions-body');
    body.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading submissions...</td></tr>';
    openModal('gradeModal');

    try {
        const res = await fetch(`${API_BASE}/api/submissions?assignmentId=${assignmentId}`);
        const data = await res.json();

        if (data.success) {
            if (data.submissions.length === 0) {
                body.innerHTML = '<tr><td colspan="4" style="text-align: center;">No submissions yet.</td></tr>';
                return;
            }
            body.innerHTML = data.submissions.map(s => {
                const linkLabel = s.fileUrl ? `<a href="${API_BASE}${s.fileUrl}" target="_blank" class="btn btn-outline btn-sm">📄 View PDF</a>` :
                    (s.link ? `<a href="${s.link}" target="_blank" class="btn btn-outline btn-sm">🔗 Link</a>` : '<span style="color:var(--text-muted)">No file</span>');
                return `
                <tr>
                    <td>-</td>
                    <td>${s.studentName}</td>
                    <td>
                        ${linkLabel}
                        <div style="margin-top: 6px;"><span class="badge badge-success" style="font-size: 0.70rem;">Submitted</span></div>
                    </td>
                    <td>
                        <select class="form-control" style="max-width: 100px; padding: 6px 10px; font-size: 0.85rem;">
                            <option value="">—</option>
                            <option>A+</option>
                            <option>A</option>
                            <option>B+</option>
                            <option>B</option>
                            <option>C</option>
                            <option>F</option>
                        </select>
                    </td>
                </tr>
            `}).join('');
        }
    } catch (err) {
        console.error(err);
        body.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--danger);">Failed to load submissions</td></tr>';
    }
}

function saveGrades() {
    closeModal('gradeModal');
    showToast('Grades saved successfully!', 'success');
}

let attendanceMode = false;

function toggleAttendanceMode() {
    attendanceMode = !attendanceMode;
    const section = document.getElementById('attendance-marking');
    const btn = document.getElementById('mark-attendance-btn');

    if (attendanceMode) {
        section.style.display = 'block';
        btn.textContent = '✕ Cancel';
        btn.className = 'btn btn-danger';
        renderAttendanceMarking();
    } else {
        section.style.display = 'none';
        btn.textContent = '📋 Mark Attendance';
        btn.className = 'btn btn-primary';
    }
}

function saveAttendance() {
    attendanceMode = false;
    document.getElementById('attendance-marking').style.display = 'none';
    const btn = document.getElementById('mark-attendance-btn');
    btn.textContent = '📋 Mark Attendance';
    btn.className = 'btn btn-primary';
    showToast('Attendance saved successfully!', 'success');
}

function sendAlert(studentName) {
    if (confirm(`Send attendance alert to ${studentName}?`)) {
        showToast(`Alert sent to ${studentName}!`, 'success');
    }
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
    renderRecentActivity();
    renderFacultyAnnouncements();
    renderFacultyTimetable();
    renderAttendanceProgress();
    renderLowAttendance();
    fetchAssignments(); // Loads assignments dynamically from MongoDB
});
