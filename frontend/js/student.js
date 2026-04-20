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
const API_BASE = 'http://localhost:5001';

let timetableData = {}; // fetched from MongoDB

const attendanceData = [
    { subject: 'Operating System', percent: 92 },
    { subject: 'OOps using JAVA', percent: 88 },
    { subject: 'Automata', percent: 85 },
    { subject: 'Python', percent: 90 },
    { subject: 'Ethical Research', percent: 78 },
    { subject: 'Sensor & Instrumentation', percent: 94 }
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

function renderTodaySchedule() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const slots = timetableData[today];
    const container = document.getElementById('today-schedule');

    // Update the card title to show which day
    const scheduleTitle = container.closest('.card');
    if (scheduleTitle) {
        const titleEl = scheduleTitle.querySelector('.card-title');
        if (titleEl) titleEl.textContent = `Today's Schedule — ${today}`;
    }

    if (!slots || slots.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🎉</div>
                <p style="font-size: 1rem; font-weight: 600;">No classes today!</p>
                <p style="font-size: 0.85rem; margin-top: 6px;">Enjoy your ${today}.</p>
            </div>
        `;
        return;
    }

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

// Fetch timetable from MongoDB
async function fetchTimetable() {
    try {
        const res = await fetch(`${API_BASE}/api/timetable`);
        const data = await res.json();
        if (data.success && data.timetable) {
            const tt = data.timetable;
            // Extract day arrays from the MongoDB document
            timetableData = {
                Monday: tt.Monday || [],
                Tuesday: tt.Tuesday || [],
                Wednesday: tt.Wednesday || [],
                Thursday: tt.Thursday || [],
                Friday: tt.Friday || [],
                Saturday: tt.Saturday || [],
                Sunday: tt.Sunday || []
            };
            renderTodaySchedule();
            renderFullTimetable();
        }
    } catch (err) {
        console.error('Failed to fetch timetable:', err);
    }
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
            ? `<span class="badge badge-success">\u2705 Submitted${a.grade ? ' \u2014 Grade: ' + a.grade : ''}</span>`
            : `<span class="badge badge-warning">\u23f3 Pending</span>`;
        const actionBtn = a.submitted
            ? ''
            : `<button class="btn btn-primary btn-sm" onclick="openSubmitModal('${a.id}')">Submit \u2192</button>`;
        return `
            <div class="assignment-card">
                <div class="assignment-header">
                    <div>
                        <div class="assignment-title">${a.title}</div>
                        <div class="assignment-subject">${a.subject} \u2014 ${a.faculty}</div>
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
    } else {
        badge.style.display = 'none';
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
    fetchAnnouncements();
    fetchTimetable();
});
