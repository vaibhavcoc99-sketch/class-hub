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
const API_BASE = window.location.origin;

let timetableData = {}; // fetched from MongoDB

let attendanceData = [];
let lowAttendanceStudents = [];
let assignedStudents = [];

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

// ---- Populate all subject labels with faculty's own subject from profile ----
function initSubjectLabels() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department || 'Your Subject';

    // Assignment modal label
    const asgLabel = document.getElementById('asg-subject-label');
    if (asgLabel) asgLabel.textContent = subject;

    // Timetable modal label
    const ttLabel = document.getElementById('tt-subject-label');
    if (ttLabel) ttLabel.textContent = subject;

    // Attendance marking label
    const attLabel = document.getElementById('attendance-subject-label');
    if (attLabel) attLabel.textContent = subject;

    // Internal marks label
    const marksLabel = document.getElementById('marks-subject-label');
    if (marksLabel) marksLabel.textContent = subject;
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

// Match slot subject to faculty's department — handles "OOps using JAVA" vs "OOps in java" etc.
function subjectMatchesFaculty(slotSubject, facultyDept) {
    if (!slotSubject || !facultyDept) return false;
    const a = slotSubject.toLowerCase();
    const b = facultyDept.toLowerCase();
    if (a === b || a.includes(b) || b.includes(a)) return true;
    
    const norm = s => s.replace(/[^a-z0-9]/g, '');
    if (norm(a) === norm(b) || norm(a).includes(norm(b)) || norm(b).includes(norm(a))) return true;

    // Fuzzy word-based match: if they share any word >= 4 characters
    const wordsA = a.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    const wordsB = b.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    return wordsA.some(w => wordsB.includes(w));
}

function renderFacultyTimetable() {
    const container = document.getElementById('faculty-timetable');
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const today = new Date().toISOString().slice(0, 10);

    let html = '';
    let hasAnySlot = false;

    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    for (const day of dayOrder) {
        const slots = timetableData[day] || [];
        const mySlots = slots.filter(slot =>
            !slot.isBreak && subjectMatchesFaculty(slot.subject, user.department)
        );
        if (mySlots.length === 0) continue;
        hasAnySlot = true;

        html += `<div class="timetable-day">${day}</div>`;
        html += mySlots.map(slot => {
            const suspKey = `${day}||${slot.time}`;
            const isSuspended = suspendedSlots.has(suspKey);
            return `
            <div class="timetable-slot" style="${isSuspended ? 'opacity:0.45;' : ''}">
                <div class="slot-time" style="${isSuspended ? 'text-decoration:line-through; color:var(--danger-light);' : ''}">${slot.time}</div>
                <div class="slot-details" style="flex:1;">
                    <div class="slot-subject" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.subject}</div>
                    <div class="slot-faculty" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.faculty || ''} <span class="slot-room">${slot.room || ''}</span></div>
                </div>
                ${isSuspended
                    ? `<span style="font-size:0.78rem; color:var(--danger-light); font-weight:600; padding:4px 12px; border:1px solid var(--danger-light); border-radius:20px; white-space:nowrap;">🚫 Suspended</span>`
                    : `<button onclick="suspendClass('${day}', '${slot.time.replace(/'/g,"\\'")}', '${today}')"
                            style="background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:none; padding:6px 16px; border-radius:8px; cursor:pointer; font-size:0.78rem; font-weight:600; white-space:nowrap; flex-shrink:0;">
                            🚫 Suspend
                        </button>`
                }
            </div>`;
        }).join('');
    }

    if (!hasAnySlot) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">
            <div style="font-size:2.5rem; margin-bottom:10px;">📅</div>
            <p>No timetable slots found for <strong>${user.department || 'your subject'}</strong>.</p>
        </div>`;
        return;
    }
    container.innerHTML = html;
}

// Suspended slots for today: "Day||time" strings
let suspendedSlots = new Set();

async function fetchSuspendedSlots() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${API_BASE}/api/suspend-class?date=${today}`);
        const data = await res.json();
        if (data.success) {
            suspendedSlots = new Set(data.suspensions.map(s => `${s.day}||${s.time}`));
        }
    } catch (err) {
        console.warn('Could not fetch suspended slots:', err);
    }
}

// One-click suspend — no prompt needed
async function suspendClass(day, time, date) {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department;
    if (!subject) return showToast('Subject not found in your profile', 'error');

    showToast('Suspending class & notifying students\u2026', 'info');

    try {
        const res = await fetch(`${API_BASE}/api/suspend-class`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, day, time, date, facultyName: user.name || 'Faculty', reason: '' })
        });
        const data = await res.json();
        if (data.success) {
            suspendedSlots.add(`${day}||${time}`);
            renderFacultyTimetable();
            showToast(`\ud83d\udeab Class suspended! ${data.sentCount} student(s) notified.`, 'success');
        } else {
            showToast(data.message || 'Failed to suspend class', 'error');
        }
    } catch (err) {
        showToast('Network error suspending class', 'error');
    }
}

// Fetch timetable from MongoDB
async function fetchTimetable() {
    try {
        const res = await fetch(`${API_BASE}/api/timetable`);
        const data = await res.json();
        if (data.success && data.timetable) {
            const tt = data.timetable;
            timetableData = {
                Monday:    tt.Monday    || [],
                Tuesday:   tt.Tuesday   || [],
                Wednesday: tt.Wednesday || [],
                Thursday:  tt.Thursday  || [],
                Friday:    tt.Friday    || [],
                Saturday:  tt.Saturday  || [],
                Sunday:    tt.Sunday    || []
            };
            await fetchSuspendedSlots();
            renderFacultyTimetable();
        }
    } catch (err) {
        console.error('Failed to fetch timetable:', err);
    }
}



// Fetch live statistics for exactly this faculty's subject
async function fetchFacultyStats() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    if (!user.department) return;

    try {
        const res = await fetch(`${API_BASE}/api/attendance/faculty-stats?subject=${encodeURIComponent(user.department)}`);
        const data = await res.json();
        if (data.success) {
            assignedStudents = data.allStudents || [];
            lowAttendanceStudents = data.lowAttendance || [];

            attendanceData = [{
                subject: user.department,
                percent: data.averageAttendance
            }];

            renderLowAttendance();
            renderAttendanceMarking();
        }
    } catch (err) {
        console.error('Failed to fetch attendance stats:', err);
    }
}

// (Subject-wise attendance progress removed — only low-attendance table shown now)

function renderLowAttendance() {
    const container = document.getElementById('low-attendance-body');
    if (!container) return;
    if (lowAttendanceStudents.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--success-light); padding:20px;">🎉 No students below 75% — great attendance!</td></tr>';
        return;
    }
    container.innerHTML = lowAttendanceStudents.map(s => `
        <tr>
            <td>${s.rollNo}</td>
            <td><strong>${s.name}</strong></td>
            <td><span style="color:var(--danger-light); font-weight:700;">${s.percent}%</span></td>
            <td style="color:var(--text-muted); font-size:0.88rem;">${s.critical || '—'}</td>
            <td>
                <button class="btn btn-sm"
                    style="background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:none; padding:5px 14px; border-radius:8px; cursor:pointer; font-size:0.82rem; display:flex; align-items:center; gap:5px;"
                    onclick="sendAttendanceAlert('${s.rollNo}', '${s.name.replace(/'/g,"\\'")}', ${s.percent})"
                >
                    🔔 Alert
                </button>
            </td>
        </tr>
    `).join('');
}

async function sendAttendanceAlert(rollNo, studentName, percent) {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const btn = event.currentTarget;
    btn.disabled = true;
    btn.textContent = '⏳ Sending…';

    try {
        const res = await fetch(`${API_BASE}/api/attendance/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rollNo,
                studentName,
                attendancePercent: percent,
                subject: user.department || 'your subject',
                facultyName: user.name || 'Faculty'
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Alert sent to ${studentName}`, 'success');
            btn.textContent = '✅ Sent';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        } else {
            showToast(data.message || 'Failed to send alert', 'error');
            btn.disabled = false;
            btn.textContent = '🔔 Alert';
        }
    } catch (err) {
        showToast('Network error sending alert', 'error');
        btn.disabled = false;
        btn.textContent = '🔔 Alert';
    }
}


function renderAttendanceMarking() {
    const container = document.getElementById('attendance-marking-body');
    // Using the original global 79-student list directly so faculty can see everyone
    container.innerHTML = GLOBAL_STUDENT_LIST.map(s => `
        <tr>
            <td>${s.rollNo}</td>
            <td>${s.name}</td>
            <td>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" class="attendance-checkbox" data-roll="${s.rollNo}" checked style="width: 18px; height: 18px; accent-color: var(--success); cursor: pointer;">
                    <span class="badge badge-success" style="font-size: 0.75rem;">Present</span>
                </label>
            </td>
        </tr>
    `).join('');

    // Toggle badge text on checkbox change
    container.querySelectorAll('.attendance-checkbox').forEach(cb => {
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
    const avg = attendanceData.length > 0 ? attendanceData[0].percent : 0; // Derived directly from the single subject tracked

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
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department; // auto from faculty profile
    const description = document.getElementById('asg-description').value.trim();
    const dueDate = document.getElementById('asg-due').value;
    const totalMarks = parseInt(document.getElementById('asg-marks').value) || 100;

    if (!subject) {
        showToast('Could not detect your subject. Please log in again.', 'error');
        return;
    }

    const dateObj = new Date(dueDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
    const faculty = document.getElementById('tt-faculty').value;
    const room    = document.getElementById('tt-room').value;
    const reason  = document.getElementById('tt-reason').value.trim();
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department; // auto from faculty profile

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

async function saveAttendance() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const selectedSubject = user.department; // auto from faculty profile

    if (!selectedSubject) return showToast('Error: Subject not found in your profile. Please log in again.', 'error');

    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    const presentRollNos = [];
    const absentRollNos = [];

    checkboxes.forEach(cb => {
        const roll = cb.getAttribute('data-roll');
        if (cb.checked) {
            presentRollNos.push(roll);
        } else {
            absentRollNos.push(roll);
        }
    });

    const btn = document.getElementById('mark-attendance-btn') || document.querySelector('.btn-success[onclick="saveAttendance()"]');
    if (btn) {
        btn.textContent = '⏳ Saving...';
        btn.disabled = true;
    }

    try {
        const payload = {
            date: new Date().toISOString(),
            subject: selectedSubject,
            facultyId: user.id || user._id, // Support different token formats
            presentRollNos,
            absentRollNos
        };

        const res = await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (btn) {
            btn.textContent = 'Save Attendance';
            btn.disabled = false;
        }

        if (data.success) {
            showToast('✅ Attendance marked securely!', 'success');
            
            // Clean up UI state
            attendanceMode = false;
            document.getElementById('attendance-marking').style.display = 'none';
            const triggerBtn = document.getElementById('mark-attendance-btn');
            if (triggerBtn) {
                triggerBtn.textContent = '📋 Mark Attendance';
                triggerBtn.className = 'btn btn-primary';
            }
            
            // Re-fetch the live analytics
            await fetchFacultyStats();
            updateStats();
        } else {
            showToast(data.message || 'Failed to save attendance', 'error');
        }

    } catch (err) {
        console.error('Failed to post attendance', err);
        showToast('Network Error. Is the backend running?', 'error');
        if (btn) {
            btn.textContent = 'Save Attendance';
            btn.disabled = false;
        }
    }
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

// ============================================================
//  📊  INTERNAL MARKS — Faculty Entry Functions
// ============================================================

// Load marks for this faculty's subject automatically on page init
async function loadInternalMarks() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department;
    if (!subject) return;

    const tableContainer = document.getElementById('marks-table-container');
    const emptyState     = document.getElementById('marks-empty');
    const tbody          = document.getElementById('marks-table-body');

    // Show loading spinner in empty state (already visible by default)
    if (emptyState) {
        emptyState.innerHTML = '<div style="font-size:3rem; margin-bottom:12px;">⏳</div><p>Loading marks…</p>';
        emptyState.style.display = 'block';
    }
    if (tableContainer) tableContainer.style.display = 'none';

    // Fetch already-saved marks for this subject
    let savedMarksMap = {};
    try {
        const res = await fetch(`${API_BASE}/api/internal-marks?subject=${encodeURIComponent(subject)}`);
        const data = await res.json();
        if (data.success && data.marks.length > 0) {
            data.marks.forEach(m => { savedMarksMap[m.rollNo] = m; });
        }
    } catch (err) {
        console.warn('Could not load saved marks:', err);
    }

    // Render a row for every student
    tbody.innerHTML = GLOBAL_STUDENT_LIST.map(s => {
        const saved = savedMarksMap[s.rollNo] || {};
        const v = (val) => (val !== null && val !== undefined) ? val : '';
        return `
            <tr data-roll="${s.rollNo}">
                <td>${s.rollNo}</td>
                <td>${s.name}</td>
                <td><input type="number" class="marks-input" min="0" step="0.5"
                    placeholder="—" value="${v(saved.ct1)}"
                    style="width:70px; background:transparent; border:1px solid var(--border); border-radius:6px; padding:4px 8px; color:var(--text-primary); text-align:center;"></td>
                <td><input type="number" class="marks-input" min="0" step="0.5"
                    placeholder="—" value="${v(saved.ct2)}"
                    style="width:70px; background:transparent; border:1px solid var(--border); border-radius:6px; padding:4px 8px; color:var(--text-primary); text-align:center;"></td>
                <td><input type="number" class="marks-input" min="0" max="5" step="0.5"
                    placeholder="0-5" value="${v(saved.assignmentMarks)}"
                    style="width:70px; background:transparent; border:1px solid var(--border); border-radius:6px; padding:4px 8px; color:var(--text-primary); text-align:center;"></td>
                <td><input type="number" class="marks-input" min="0" max="5" step="0.5"
                    placeholder="0-5" value="${v(saved.attendanceMarks)}"
                    style="width:70px; background:transparent; border:1px solid var(--border); border-radius:6px; padding:4px 8px; color:var(--text-primary); text-align:center;"></td>
            </tr>`;
    }).join('');

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState)     emptyState.style.display     = 'none';
}

async function saveInternalMarks() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    const subject = user.department; // auto from profile
    if (!subject) { showToast('Subject not found in profile', 'warning'); return; }
    const rows = document.querySelectorAll('#marks-table-body tr[data-roll]');
    const marks = [];

    rows.forEach(row => {
        const rollNo = row.getAttribute('data-roll');
        const student = GLOBAL_STUDENT_LIST.find(s => s.rollNo === rollNo);
        const inputs = row.querySelectorAll('.marks-input');
        const parse = (inp) => inp.value.trim() === '' ? null : parseFloat(inp.value);
        marks.push({
            rollNo,
            name: student ? student.name : '',
            ct1:             parse(inputs[0]),
            ct2:             parse(inputs[1]),
            assignmentMarks: parse(inputs[2]),
            attendanceMarks: parse(inputs[3])
        });
    });

    const saveBtn = document.getElementById('save-marks-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

    try {
        const res = await fetch(`${API_BASE}/api/internal-marks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, facultyName: user.name || 'Faculty', marks })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`📊 Marks saved for "${subject}"!`, 'success');
        } else {
            showToast(data.message || 'Failed to save marks', 'error');
        }
    } catch (err) {
        console.error('Save marks error:', err);
        showToast('Network error while saving marks', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Marks'; }
    }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async function () {
    initSubjectLabels(); // Populate all subject labels from user.department
    updateStats();
    renderRecentActivity();
    renderFacultyAnnouncements();
    renderFacultyTimetable();

    // Core data fetches
    await fetchFacultyStats();
    await fetchAssignments();
    await fetchTimetable();

    // Auto-load internal marks for the faculty's subject
    loadInternalMarks();

    updateStats();
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
