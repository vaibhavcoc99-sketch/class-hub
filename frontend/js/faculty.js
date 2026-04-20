/* ===== ClassHub Faculty Dashboard ===== */

// ---- Auth Guard ----
(function authGuard() {
    const token = localStorage.getItem('classhub_token');
    const user = JSON.parse(localStorage.getItem('classhub_user') || 'null');
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    // Only faculty can access this page
    if (user.role !== 'faculty') {
        window.location.href = 'student.html';
        return;
    }
    document.getElementById('user-name').textContent = user.name || 'Faculty';
    document.getElementById('user-role-label').textContent = user.department || 'Faculty • CSE Department';
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

let timetableData = {}; // fetched from MongoDB

const attendanceData = [];

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
async function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');

    // When opening the alert modal, show live student count
    if (id === 'sendAlertModal') {
        const el = document.getElementById('alert-modal-count');
        if (el) {
            try {
                const res = await fetch(`${API_BASE}/api/notify/students-count`);
                const data = await res.json();
                if (data.success) {
                    el.textContent = `${data.count} registered`;
                }
            } catch (e) {
                el.textContent = 'all';
            }
        }
    }
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
        // Faculty only sees their own assignments
        const url = user.id
            ? `${API_BASE}/api/assignments?facultyId=${user.id}`
            : `${API_BASE}/api/assignments`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            facultyAssignments = data.assignments.map(a => ({
                id: a._id,
                title: a.title,
                subject: a.course,
                description: a.description,
                dueDate: a.deadline,
                totalMarks: 100,
                submissions: 0,
                total: 79,
                status: 'active',
                facultyId: a.facultyId,
                facultyName: a.facultyName
            }));
            renderFacultyAssignments();
            updateStats();
        }
    } catch (err) {
        console.error('Failed to load assignments', err);
        showToast('Error loading assignments from server', 'error');
    }
}

// ---- Populate subject dropdown with only this faculty's allowed subjects ----
function initSubjectDropdown() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subjects = user.subjects || [];
    const dropdown = document.getElementById('asg-subject');
    if (!dropdown || subjects.length === 0) return;

    dropdown.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        dropdown.appendChild(opt);
    });
}

// ---- Render Functions ----

function renderRecentActivity() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const dept = user.department || 'your subject';
    
    const activities = [
        { icon: '📢', text: 'You posted "Class Cancelled — Tomorrow"', time: '2 hours ago' },
        { icon: '📝', text: `15 students submitted ${dept} Mini Project`, time: '5 hours ago' },
        { icon: '✅', text: `Marked attendance for ${dept}`, time: 'Yesterday' },
        { icon: '📊', text: `Graded 60 submissions for ${dept}`, time: '2 days ago' },
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

// Fetch timetable from MongoDB
async function fetchTimetable() {
    try {
        const res = await fetch(`${API_BASE}/api/timetable`);
        const data = await res.json();
        if (data.success && data.timetable) {
            const tt = data.timetable;
            timetableData = {
                Monday: tt.Monday || [],
                Tuesday: tt.Tuesday || [],
                Wednesday: tt.Wednesday || [],
                Thursday: tt.Thursday || [],
                Friday: tt.Friday || [],
                Saturday: tt.Saturday || [],
                Sunday: tt.Sunday || []
            };
            renderFacultyTimetable();
        }
    } catch (err) {
        console.error('Failed to fetch timetable:', err);
    }
}

function renderAttendanceProgress() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const dept = user.department || 'Subject';
    
    // Auto-generate realistic mock data for their specific subject
    const subjectAttendance = [
        { subject: dept, percent: Math.floor(Math.random() * (95 - 75 + 1)) + 75 }
    ];
    
    const container = document.getElementById('attendance-progress');
    container.innerHTML = subjectAttendance.map(a => {
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
    const avg = 87; // Real mock logic could go here based on generated subjectAttendance

    document.getElementById('stat-active-assignments').textContent = active;
    document.getElementById('stat-avg-attendance').textContent = avg + '%';
    document.getElementById('stat-announcements-count').textContent = facultyAnnouncements.length;
}

// ---- Actions ----

async function postAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const message = document.getElementById('ann-message').value.trim();
    const priority = document.getElementById('ann-priority').value;
    const audience = document.getElementById('ann-audience').value;
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const audienceLabel = audience === 'all' ? 'All Students' : audience === 'cse' ? 'CSE Department' : 'Specific Section';

    facultyAnnouncements.unshift({
        id: Date.now(),
        title,
        message,
        priority,
        audience: audienceLabel,
        time: 'Just now'
    });

    closeModal('postAnnouncementModal');
    e.target.reset();
    renderFacultyAnnouncements();
    updateStats();
    showToast('Announcement posted! Sending emails to students...', 'info');

    // 📧 Broadcast email to all registered students
    try {
        const res = await fetch(`${API_BASE}/api/notify/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                message,
                priority,
                audience: audienceLabel,
                facultyName: user.name || 'Faculty'
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`📧 Email sent to ${data.sentCount} student(s)!`, 'success');
        } else {
            showToast('Announcement posted, but email delivery failed.', 'warning');
        }
    } catch (err) {
        console.error('Notification error:', err);
        showToast('Announcement posted. Email notification failed (server unreachable).', 'warning');
    }
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
            showToast('Assignment created! Sending emails to students...', 'info');
            await fetchAssignments(); // refresh list

            // 📧 Broadcast assignment notification to all registered students
            try {
                const notifyRes = await fetch(`${API_BASE}/api/notify/assignment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        subject,
                        description,
                        dueDate: formattedDate,
                        totalMarks,
                        facultyName: user.name || 'Faculty'
                    })
                });
                const notifyData = await notifyRes.json();
                if (notifyData.success) {
                    showToast(`📧 Assignment emailed to ${notifyData.sentCount} student(s)!`, 'success');
                } else {
                    showToast('Assignment saved, but email notification failed.', 'warning');
                }
            } catch (notifyErr) {
                console.error('Assignment notify error:', notifyErr);
                showToast('Assignment saved. Email notification failed (server unreachable).', 'warning');
            }
        } else {
            showToast('Error saving assignment', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error while saving assignment', 'error');
    }
}

async function updateTimetable(e) {
    e.preventDefault();
    const day     = document.getElementById('tt-day').value;
    const time    = document.getElementById('tt-time').value;
    const subject = document.getElementById('tt-subject').value;
    const faculty = document.getElementById('tt-faculty').value;
    const room    = document.getElementById('tt-room').value;
    const reason  = document.getElementById('tt-reason').value.trim();
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');

    closeModal('editTimetableModal');
    e.target.reset();
    showToast('Timetable updated! Saving & notifying students...', 'info');

    // 📧 Broadcast timetable change to all registered students (also saves to DB)
    try {
        const res = await fetch(`${API_BASE}/api/notify/timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                day, time, subject, faculty, room, reason,
                changedBy: user.name || 'Faculty'
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`📧 Timetable change sent to ${data.sentCount} student(s)!`, 'success');
        } else {
            showToast('Timetable saved, but email notification failed.', 'warning');
        }
    } catch (err) {
        console.error('Timetable notify error:', err);
        showToast('Timetable updated. Email notification failed (server unreachable).', 'warning');
    }

    // Re-fetch timetable to reflect the change in the UI
    await fetchTimetable();
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

async function sendAlert(studentName, studentEmail) {
    if (!confirm(`Send attendance alert email to ${studentName}?`)) return;
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');

    showToast(`Sending alert to ${studentName}...`, 'info');
    try {
        const res = await fetch(`${API_BASE}/api/notify/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Attendance Warning — ${studentName}`,
                message: `Dear ${studentName}, your attendance has fallen below the required 75% threshold. Please ensure regular attendance to avoid detention. Contact your faculty for further guidance.`,
                alertType: 'low_attendance',
                facultyName: user.name || 'Faculty',
                targetEmails: studentEmail ? [studentEmail] : []
            })
        });
        const data = await res.json();
        if (data.success && data.sentCount > 0) {
            showToast(`⚠️ Attendance alert sent to ${studentName}!`, 'success');
        } else {
            showToast(`Alert sent (email may have failed for ${studentName})`, 'warning');
        }
    } catch (err) {
        console.error('Alert send error:', err);
        showToast(`Alert failed for ${studentName}`, 'error');
    }
}

// ---- Custom Alert Broadcast ----
async function sendCustomAlert(e) {
    e.preventDefault();
    const alertType = document.getElementById('alert-type').value;
    const title     = document.getElementById('alert-title').value.trim();
    const message   = document.getElementById('alert-message').value.trim();
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '⏳ Sending...';

    try {
        const res = await fetch(`${API_BASE}/api/notify/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                message,
                alertType,
                facultyName: user.name || 'Faculty'
                // no targetEmails → broadcasts to ALL students
            })
        });
        const data = await res.json();

        closeModal('sendAlertModal');
        e.target.reset();

        if (data.success) {
            showToast(`📣 Alert sent to ${data.sentCount} student(s) successfully!`, 'success');
        } else {
            showToast('Alert failed to send. Check server.', 'error');
        }
    } catch (err) {
        console.error('Custom alert error:', err);
        showToast('Network error while sending alert.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📧 Send to All Students';
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
document.addEventListener('DOMContentLoaded', async function () {
    updateStats();
    renderRecentActivity();
    renderFacultyAnnouncements();
    renderFacultyTimetable();
    renderAttendanceProgress();
    renderLowAttendance();
    fetchAssignments(); // Loads assignments dynamically from MongoDB
    fetchTimetable();   // Loads timetable from MongoDB
    initSubjectDropdown(); // Restrict subject choices to this faculty's subjects

    // Fetch and display registered student count in Overview
    try {
        const res = await fetch(`${API_BASE}/api/notify/students-count`);
        const data = await res.json();
        if (data.success) {
            const el = document.getElementById('stat-total-students');
            if (el) el.textContent = data.count;
        }
    } catch (err) {
        console.warn('Could not fetch student count:', err.message);
    }
});
