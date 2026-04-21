/* ===== ClassHub Student Dashboard ===== */

// ---- Auth Guard ----
(function authGuard() {
    const token = localStorage.getItem('classhub_token');
    const user = JSON.parse(localStorage.getItem('classhub_user') || 'null');
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    // Only students can access this page
    if (user.role !== 'student') {
        window.location.href = 'faculty.html';
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

// ---- Data ----
let announcements = []; // fetched from MongoDB

let assignments = []; // dynamically fetched from MongoDB
const API_BASE = window.location.origin;

let timetableData = {}; // fetched from MongoDB

let attendanceData = []; // dynamically fetched from MongoDB

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

    // Re-render chart explicitly if switching to analytics
    if (tabName === 'analytics') {
        fetchInternalMarks();
        fetchStudentAttendance();
    }

    // Re-render when switching to relevant tabs
    if (tabName === 'timetable') {
        fetchTimetable(); // always re-fetch to ensure data is populated
    }

    // When switching to announcements tab, mark visible ones as read after a small delay
    if (tabName === 'announcements') {
        setTimeout(() => observeUnreadBubbles(), 400);
    }
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

// ============================================================
//  📢  ANNOUNCEMENT SYSTEM (MongoDB-backed, WhatsApp-style)
// ============================================================

// Read tracking via localStorage
function getReadAnnouncementIds() {
    try {
        return JSON.parse(localStorage.getItem('classhub_read_announcements') || '[]');
    } catch (e) { return []; }
}

function markAnnouncementRead(id) {
    const readIds = getReadAnnouncementIds();
    if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem('classhub_read_announcements', JSON.stringify(readIds));
    }
}

function isAnnouncementUnread(id) {
    return !getReadAnnouncementIds().includes(id);
}

// Fetch from MongoDB
async function fetchAnnouncements() {
    try {
        const res = await fetch(`${API_BASE}/api/announcements`);
        const data = await res.json();
        if (data.success) {
            announcements = data.announcements.map(a => ({
                id: a._id,
                title: a.title,
                message: a.message,
                priority: a.priority || 'normal',
                audience: a.audience || 'All Students',
                facultyName: a.facultyName || 'Faculty',
                createdAt: a.createdAt,
                unread: isAnnouncementUnread(a._id)
            }));

            renderAllAnnouncements();
            renderRecentAnnouncements();
            updateStats();
            updateChatSubtitle();
        }
    } catch (err) {
        console.error('Failed to fetch announcements:', err);
    }
}

// Format date/time helpers
function formatChatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatChatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (today - msgDay) / (1000 * 60 * 60 * 24);

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function updateChatSubtitle() {
    const el = document.getElementById('chat-subtitle');
    if (!el) return;
    const total = announcements.length;
    const unread = announcements.filter(a => a.unread).length;
    if (total === 0) {
        el.textContent = 'No announcements yet';
    } else if (unread > 0) {
        el.textContent = `${total} messages \u00b7 ${unread} unread`;
    } else {
        el.textContent = `${total} messages`;
    }
}

// Render WhatsApp-style announcement bubbles
function renderAllAnnouncements() {
    const container = document.getElementById('all-announcements');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <div class="chat-empty-icon">\ud83d\udced</div>
                <p>No announcements yet</p>
                <p style="font-size: 0.8rem; margin-top: 6px; opacity: 0.6;">Announcements from faculty will appear here</p>
            </div>
        `;
        return;
    }

    // Sort by date (oldest first for chat feel)
    const sorted = [...announcements].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let html = '';
    let lastDate = '';

    sorted.forEach((a, idx) => {
        const dateLabel = formatChatDate(a.createdAt);
        const timeLabel = formatChatTime(a.createdAt);

        // Date separator
        if (dateLabel !== lastDate) {
            html += `<div class="chat-date-separator"><span>${dateLabel}</span></div>`;
            lastDate = dateLabel;
        }

        const priorityIcons = { urgent: '\ud83d\udea8', important: '\u26a0\ufe0f', normal: '\ud83d\udce2' };
        const isUnread = a.unread;

        html += `
            <div class="chat-bubble ${isUnread ? 'unread' : ''}" data-announcement-id="${a.id}" style="animation-delay: ${idx * 0.04}s">
                <div class="chat-bubble-inner">
                    <div class="chat-faculty-name">
                        \ud83d\udc64 ${a.facultyName}
                        <span class="chat-priority-tag ${a.priority}">${priorityIcons[a.priority] || '\ud83d\udce2'} ${a.priority}</span>
                    </div>
                    <div class="chat-bubble-title">${a.title}</div>
                    <div class="chat-bubble-message">${a.message}</div>
                    <div class="chat-bubble-footer">
                        <span class="chat-bubble-time">${timeLabel}</span>
                        <span class="chat-read-ticks ${isUnread ? '' : 'read'}">${isUnread ? '\u2713' : '\u2713\u2713'}</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Auto-scroll to bottom (latest message)
    container.scrollTop = container.scrollHeight;

    // Start observing unread bubbles
    setTimeout(() => observeUnreadBubbles(), 300);
}

// Render recent announcements on the Overview tab (top 3 newest)
function renderRecentAnnouncements() {
    const container = document.getElementById('recent-announcements');
    if (!container) return;

    const recent = announcements.slice(0, 3); // already sorted newest first from API
    if (recent.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 16px; text-align: center; font-size: 0.9rem;">No announcements yet</div>';
        return;
    }

    container.innerHTML = recent.map(a => {
        const icons = { urgent: '\ud83d\udea8', important: '\u26a0\ufe0f', normal: '\ud83d\udce2' };
        const priorityClass = `priority-${a.priority}`;
        const timeLabel = formatChatTime(a.createdAt);
        const dateLabel = formatChatDate(a.createdAt);
        return `
            <div class="notification-item ${a.unread ? 'unread' : ''}">
                <div class="notification-content">
                    <h4>${icons[a.priority] || '\ud83d\udce2'} ${a.title} <span class="notification-priority ${priorityClass}">${a.priority}</span></h4>
                    <p>${a.message}</p>
                    <div class="notification-time">Posted by ${a.facultyName} \u2014 ${dateLabel}, ${timeLabel}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render upcoming deadlines on the Overview tab (pending assignments sorted by due date)
function renderUpcomingDeadlines() {
    const container = document.getElementById('upcoming-deadlines');
    if (!container) return;

    const pending = assignments
        .filter(a => !a.submitted && a.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4);

    if (pending.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 16px; text-align: center; font-size: 0.9rem;">No upcoming deadlines 🎉</div>';
        return;
    }

    container.innerHTML = pending.map(a => {
        const due = new Date(a.dueDate);
        const now = new Date();
        const diffMs = due - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let urgency = '';
        let urgencyColor = 'var(--text-muted)';
        if (diffDays < 0) {
            urgency = 'Overdue';
            urgencyColor = 'var(--danger-light, #ef4444)';
        } else if (diffDays === 0) {
            urgency = 'Due today';
            urgencyColor = 'var(--danger-light, #ef4444)';
        } else if (diffDays === 1) {
            urgency = 'Due tomorrow';
            urgencyColor = '#f97316';
        } else if (diffDays <= 3) {
            urgency = `Due in ${diffDays} days`;
            urgencyColor = '#f59e0b';
        } else {
            urgency = `Due in ${diffDays} days`;
            urgencyColor = 'var(--success-light, #22c55e)';
        }

        const dateStr = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="notification-item">
                <div class="notification-content">
                    <h4>📝 ${a.title}</h4>
                    <p>${a.subject} — ${a.faculty}</p>
                    <div class="notification-time" style="color: ${urgencyColor}; font-weight: 600;">${urgency} (${dateStr})</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render all assignments in the Assignments tab
function renderAllAssignments() {
    const container = document.getElementById('all-assignments');
    if (!container) return;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">📝</div>
                <p style="font-size: 1rem; font-weight: 600;">No assignments yet</p>
                <p style="font-size: 0.85rem; margin-top: 6px; opacity: 0.7;">Assignments posted by faculty will appear here.</p>
            </div>`;
        return;
    }

    container.innerHTML = assignments.map(a => {
        const due = a.dueDate ? new Date(a.dueDate) : null;
        const now = new Date();
        const isOverdue = due && due < now && !a.submitted;
        const dateStr = due
            ? due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'No deadline';

        const statusLabel = a.submitted
            ? '<span style="color: var(--success-light, #22c55e); font-weight: 600;">✅ Submitted</span>'
            : isOverdue
                ? '<span style="color: var(--danger-light, #ef4444); font-weight: 600;">⚠️ Overdue</span>'
                : '<span style="color: #f59e0b; font-weight: 600;">⏳ Pending</span>';

        const submitBtn = a.submitted
            ? ''
            : `<button class="btn btn-primary btn-sm" onclick="openSubmitModal('${a.id}')">Submit</button>`;

        return `
            <div class="notification-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="notification-content" style="flex: 1;">
                    <h4>📝 ${a.title}</h4>
                    <p>${a.subject} — ${a.faculty}</p>
                    ${a.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${a.description}</p>` : ''}
                    <div class="notification-time">
                        📅 ${dateStr} &nbsp;·&nbsp; ${statusLabel}
                    </div>
                </div>
                <div style="margin-left: 12px; flex-shrink: 0;">
                    ${submitBtn}
                </div>
            </div>
        `;
    }).join('');
}

// IntersectionObserver: mark announcements as read when scrolled into view
let announcementObserver = null;

function observeUnreadBubbles() {
    // Disconnect previous observer
    if (announcementObserver) announcementObserver.disconnect();

    const container = document.getElementById('all-announcements');
    if (!container) return;

    const unreadBubbles = container.querySelectorAll('.chat-bubble.unread');
    if (unreadBubbles.length === 0) return;

    announcementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bubble = entry.target;
                const id = bubble.dataset.announcementId;

                // Mark read after 1.5 seconds of being visible
                setTimeout(() => {
                    if (bubble.classList.contains('unread')) {
                        markAnnouncementRead(id);
                        bubble.classList.remove('unread');
                        // Update ticks
                        const ticks = bubble.querySelector('.chat-read-ticks');
                        if (ticks) {
                            ticks.textContent = '\u2713\u2713';
                            ticks.classList.add('read');
                        }
                        // Update local data
                        const ann = announcements.find(a => a.id === id);
                        if (ann) ann.unread = false;

                        updateStats();
                        updateChatSubtitle();
                        renderRecentAnnouncements();
                    }
                }, 1500);

                announcementObserver.unobserve(bubble);
            }
        });
    }, { root: container, threshold: 0.6 });

    unreadBubbles.forEach(b => announcementObserver.observe(b));
}

// Mark all read button
function markAllAnnouncementsRead() {
    announcements.forEach(a => {
        if (a.unread) {
            markAnnouncementRead(a.id);
            a.unread = false;
        }
    });
    renderAllAnnouncements();
    renderRecentAnnouncements();
    updateStats();
    updateChatSubtitle();
    showToast('All announcements marked as read', 'success');
}

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

// Suspended classes for today: Set of "Day||time"
let suspendedSlotsStudent = new Set();
// Also store full suspension objects for subject matching
let suspensionsList = [];

async function fetchSuspendedSlotsStudent() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${API_BASE}/api/suspend-class?date=${today}`);
        const data = await res.json();
        if (data.success) {
            suspensionsList = data.suspensions;
            suspendedSlotsStudent = new Set(data.suspensions.map(s => `${s.day}||${s.time}`));
        }
    } catch (err) {
        console.warn('Could not fetch suspensions:', err);
    }
}

// Check if a specific slot is suspended (match by day + time; slot subject check ensures correctness)
function isSlotSuspended(day, slot) {
    const key = `${day}||${slot.time}`;
    if (!suspendedSlotsStudent.has(key)) return false;
    
    // Double-check against the subject too (different teachers could own different slots at same time)
    return suspensionsList.some(sus => {
        if (sus.day !== day || sus.time !== slot.time) return false;
        
        const a = (slot.subject || '').toLowerCase();
        const b = (sus.subject || '').toLowerCase();
        if (a === b || a.includes(b) || b.includes(a)) return true;
        
        const norm = s => s.replace(/[^a-z0-9]/g, '');
        if (norm(a) === norm(b) || norm(a).includes(norm(b)) || norm(b).includes(norm(a))) return true;

        const wordsA = a.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
        const wordsB = b.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
        return wordsA.some(w => wordsB.includes(w));
    });
}

function renderTodaySchedule() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const slots = timetableData[today];
    const container = document.getElementById('today-schedule');
    if (!container) return; // element may have been removed

    const scheduleTitle = container.closest('.card');
    if (scheduleTitle) {
        const titleEl = scheduleTitle.querySelector('.card-title');
        if (titleEl) titleEl.textContent = `Today's Schedule \u2014 ${today}`;
    }

    if (!slots || slots.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">&#x1F389;</div>
                <p style="font-size: 1rem; font-weight: 600;">No classes today!</p>
                <p style="font-size: 0.85rem; margin-top: 6px;">Enjoy your ${today}.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = slots.map(slot => {
        const isSuspended = isSlotSuspended(today, slot);
        return `
        <div class="timetable-slot ${slot.isBreak ? 'break-slot' : ''}" style="${isSuspended ? 'opacity:0.38; filter:grayscale(0.7);' : ''}">
            <div class="slot-time" style="${isSuspended ? 'text-decoration:line-through; color:var(--danger-light);' : ''}">${slot.time}</div>
            <div class="slot-details">
                <div class="slot-subject" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.subject}</div>
                ${slot.faculty ? `<div class="slot-faculty" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.faculty} <span class="slot-room">${slot.room}</span></div>` : ''}
                ${isSuspended ? `<div style="color:var(--danger-light); font-size:0.78rem; font-weight:600; margin-top:4px;">&#x1F6AB; Class Suspended</div>` : ''}
            </div>
        </div>`;
    }).join('');
}

// Fetch timetable from MongoDB
async function fetchTimetable() {
    try {
        const res = await fetch(`${API_BASE}/api/timetable?_t=${Date.now()}`);
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
            await fetchSuspendedSlotsStudent();
            renderTodaySchedule();
            renderFullTimetable();
            renderOverviewTodaySchedule();
        }
    } catch (err) {
        console.error('Failed to fetch timetable:', err);
    }
}

function renderFullTimetable() {
    const container = document.getElementById('full-timetable');
    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    let html = '';
    for (const day of dayOrder) {
        const slots = timetableData[day] || [];
        if (slots.length === 0) continue;
        html += `<div class="timetable-day">${day}</div>`;
        html += slots.map(slot => {
            const isSuspended = isSlotSuspended(day, slot);
            return `
            <div class="timetable-slot ${slot.isBreak ? 'break-slot' : ''}" style="${isSuspended ? 'opacity:0.38; filter:grayscale(0.7);' : ''}">
                <div class="slot-time" style="${isSuspended ? 'text-decoration:line-through; color:var(--danger-light);' : ''}">${slot.time}</div>
                <div class="slot-details">
                    <div class="slot-subject" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.subject}</div>
                    ${slot.faculty ? `<div class="slot-faculty" style="${isSuspended ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${slot.faculty} <span class="slot-room">${slot.room}</span></div>` : ''}
                    ${isSuspended ? `<div style="color:var(--danger-light); font-size:0.78rem; font-weight:600; margin-top:4px;">&#x1F6AB; Suspended</div>` : ''}
                </div>
            </div>`;
        }).join('');
    }
    if (container) container.innerHTML = html || '<div style="text-align:center; padding:30px; color:var(--text-muted);">No timetable available.</div>';
}

// Render TODAY's schedule into the Overview tab card (auto-updates by day)
function renderOverviewTodaySchedule() {
    const container = document.getElementById('overview-today-schedule');
    if (!container) return;

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];

    // Update the card title to show the current day
    const titleEl = document.getElementById('overview-today-title');
    if (titleEl) titleEl.textContent = `📅 Today's Schedule — ${today}`;

    const slots = timetableData[today] || [];

    if (slots.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <div style="font-size:2.5rem; margin-bottom:10px;">🎉</div>
                <p style="font-size:1rem; font-weight:600;">No classes today!</p>
                <p style="font-size:0.85rem; margin-top:6px; opacity:0.7;">Enjoy your ${today}.</p>
            </div>`;
        return;
    }

    container.innerHTML = slots.map(slot => {
        const isSuspended = isSlotSuspended(today, slot);

        // Suspended: faded out + strikethrough on all text
        const wrapStyle    = isSuspended ? 'opacity:0.4; filter:grayscale(0.8);' : '';
        const strikeThroughStyle = isSuspended ? 'text-decoration:line-through; text-decoration-color:rgba(239,68,68,0.8); color:var(--text-muted);' : '';

        return `
        <div class="timetable-slot ${slot.isBreak ? 'break-slot' : ''}" style="${wrapStyle}">
            <div class="slot-time" style="${strikeThroughStyle}">${slot.time}</div>
            <div class="slot-details">
                <div class="slot-subject" style="${strikeThroughStyle}">${slot.subject}</div>
                ${slot.faculty ? `<div class="slot-faculty" style="${strikeThroughStyle}">${slot.faculty} <span class="slot-room">${slot.room}</span></div>` : ''}
                ${isSuspended ? `<div style="color:#ef4444; font-size:0.75rem; font-weight:700; margin-top:3px; text-decoration:none;">🚫 Class Suspended</div>` : ''}
            </div>
        </div>`;
    }).join('');

    // ── Dynamically update "Today's Classes" stat card ──
    // Count only real classes (not breaks, not suspended)
    const activeClassCount = slots.filter(slot => !slot.isBreak && !isSlotSuspended(today, slot)).length;
    const statClassesEl = document.getElementById('stat-classes');
    if (statClassesEl) statClassesEl.textContent = activeClassCount;
}


// ─── Internal Marks ─────────────────────────────────────────
let internalMarksData = []; // [{subject, ct1, ct2, assignmentMarks, attendanceMarks}]
let marksBarChartInstance = null;

async function fetchInternalMarks() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    if (!user.rollNo) return;

    const loading = document.getElementById('internal-marks-loading');
    const tableWrap = document.getElementById('internal-marks-table-wrap');
    const emptyEl  = document.getElementById('internal-marks-empty');

    if (loading) loading.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (emptyEl)  emptyEl.style.display  = 'none';

    try {
        const res  = await fetch(`${API_BASE}/api/internal-marks/student/${user.rollNo}`);
        const data = await res.json();

        if (data.success) {
            // Only keep subjects that have at least one mark entered
            internalMarksData = data.marks.filter(
                m => m.ct1 !== null || m.ct2 !== null ||
                     m.assignmentMarks !== null || m.attendanceMarks !== null
            );
            renderInternalMarksTable();
            renderMarksBarChart();
        }
    } catch (err) {
        console.error('Failed to fetch internal marks:', err);
        if (loading) loading.style.display = 'none';
        if (emptyEl) { emptyEl.style.display = 'block'; }
    }
}

function renderInternalMarksTable() {
    const loading  = document.getElementById('internal-marks-loading');
    const tableWrap = document.getElementById('internal-marks-table-wrap');
    const emptyEl   = document.getElementById('internal-marks-empty');
    const tbody     = document.getElementById('internal-marks-body');

    if (loading) loading.style.display = 'none';

    if (!internalMarksData || internalMarksData.length === 0) {
        if (tableWrap) tableWrap.style.display = 'none';
        if (emptyEl)  emptyEl.style.display  = 'block';
        return;
    }

    if (tableWrap) tableWrap.style.display = 'block';
    if (emptyEl)  emptyEl.style.display  = 'none';

    const fmt = (v) => (v !== null && v !== undefined) ? v : '—';

    tbody.innerHTML = internalMarksData.map(m => `
        <tr>
            <td><strong>${m.subject}</strong></td>
            <td style="text-align:center;">${fmt(m.ct1)}</td>
            <td style="text-align:center;">${fmt(m.ct2)}</td>
            <td style="text-align:center;">
                <span style="color:${m.assignmentMarks >= 4 ? 'var(--success-light)' : m.assignmentMarks >= 3 ? 'var(--warning)' : 'var(--text-primary)'}">
                    ${fmt(m.assignmentMarks)}/5
                </span>
            </td>
            <td style="text-align:center;">
                <span style="color:${m.attendanceMarks >= 4 ? 'var(--success-light)' : m.attendanceMarks >= 3 ? 'var(--warning)' : 'var(--text-primary)'}">
                    ${fmt(m.attendanceMarks)}/5
                </span>
            </td>
        </tr>
    `).join('');
}

function renderMarksBarChart() {
    const canvas = document.getElementById('marks-bar-chart');
    if (!canvas) return;

    if (marksBarChartInstance) {
        marksBarChartInstance.destroy();
        marksBarChartInstance = null;
    }

    if (!internalMarksData || internalMarksData.length === 0) {
        canvas.parentElement.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <div style="font-size:2.5rem; margin-bottom:10px;">📊</div>
                <p>No marks data available yet.</p>
            </div>`;
        return;
    }

    const labels = internalMarksData.map(m => m.subject);
    const ct1Data  = internalMarksData.map(m => m.ct1 !== null ? m.ct1 : 0);
    const ct2Data  = internalMarksData.map(m => m.ct2 !== null ? m.ct2 : 0);
    const asgData  = internalMarksData.map(m => m.assignmentMarks !== null ? m.assignmentMarks : 0);
    const attData  = internalMarksData.map(m => m.attendanceMarks !== null ? m.attendanceMarks : 0);

    marksBarChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'CT-1',
                    data: ct1Data,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'CT-2',
                    data: ct2Data,
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Assignment (out of 5)',
                    data: asgData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Attendance (out of 5)',
                    data: attData,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        padding: 16,
                        font: { size: 12, family: "'Inter', sans-serif" }
                    }
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
            },
            scales: {
                x: {
                    ticks: { color: '#64748b', font: { size: 11 } },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#64748b', font: { size: 11 } },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

function updateStats() {
    const pending = assignments.filter(a => !a.submitted).length;
    const avg = attendanceData.length > 0 
        ? Math.round(attendanceData.reduce((s, a) => s + a.percent, 0) / attendanceData.length)
        : 100; // Default to 100% if no classes have happened yet
        
    const unread = announcements.filter(a => a.unread).length;

    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-attendance').textContent = avg + '%';
    document.getElementById('stat-announcements').textContent = unread;

    const badge = document.getElementById('announcement-badge');
    if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

async function fetchStudentAttendance() {
    const user = JSON.parse(localStorage.getItem('classhub_user') || '{}');
    if (!user.rollNo) return;

    try {
        const res = await fetch(`${API_BASE}/api/attendance/summary?rollNo=${user.rollNo}`);
        const data = await res.json();

        if (data.success && data.stats) {
            attendanceData = data.stats;
            updateStats();
            renderStudentAttendance();
        } else {
            document.getElementById('attendance-loading').style.display = 'none';
            document.getElementById('attendance-empty').style.display = 'block';
        }
    } catch (err) {
        console.error('Failed to fetch student attendance:', err);
        const l = document.getElementById('attendance-loading');
        const e = document.getElementById('attendance-empty');
        if (l) l.style.display = 'none';
        if (e) e.style.display = 'block';
    }
}

function renderStudentAttendance() {
    const loading = document.getElementById('attendance-loading');
    const container = document.getElementById('attendance-container');
    const emptyEl = document.getElementById('attendance-empty');

    if (loading) loading.style.display = 'none';

    if (!attendanceData || attendanceData.length === 0) {
        if (container) container.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (container) container.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';

    // Sort or just map directly
    container.innerHTML = attendanceData.map(stat => {
        let color = '#22c55e'; // Green
        if (stat.percent < 75) {
            color = '#ef4444'; // Red
        } else if (stat.percent <= 80) {
            color = '#f97316'; // Orange
        }

        return `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 500; font-size: 0.95rem; color: var(--text-primary);">${stat.subject}</span>
                    <span style="font-weight: 700; color: ${color};">${stat.percent}%</span>
                </div>
                <div style="width: 100%; height: 8px; background-color: var(--surface-hover); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${stat.percent}%; height: 100%; background-color: ${color}; border-radius: 4px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }).join('');
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

// (Old initCharts removed — replaced by renderMarksBarChart above)

// ---- Toast ----
function showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const icons = { success: '\u2705', error: '\u274c', info: '\u2139\ufe0f', warning: '\u26a0\ufe0f' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', function () {
    updateStats();
    renderRecentAnnouncements();
    renderUpcomingDeadlines();
    renderAllAnnouncements();
    renderAllAssignments();

    setupDropZone();

    // Fetch from MongoDB — these also call their render functions after data loads
    fetchAnnouncements();
    fetchAssignments();
    fetchTimetable();           // renders today + full timetable + dash overview after load
    fetchStudentAttendance();   // Used for the attendance % stat card
});
