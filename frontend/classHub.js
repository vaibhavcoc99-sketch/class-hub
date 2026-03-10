function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const activeBtn = Array.from(navBtns).find(btn => 
        btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)
    );
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

function markAttendance() {
    alert("Attendance marking feature would open here. This would allow CR to mark present/absent for each student for today's classes.");
}

document.addEventListener('DOMContentLoaded', function() {
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('unread');
            updateNotificationBadge();
        });
    });

    updateNotificationBadge();
});

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.nav-btn .badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
});

const addNotificationForm = document.querySelector('#addNotification form');
if (addNotificationForm) {
    addNotificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = this.querySelector('input[type="text"]').value.trim();
        const message = this.querySelector('textarea').value.trim();
        const priority = this.querySelector('select').value;
        
        if (title && message) {
            console.log('New Notification:', { title, message, priority });
            alert('Notification posted successfully!');
            this.reset();
            closeModal('addNotification');
        }
    });
}

const addAssignmentForm = document.querySelector('#addAssignment form');
if (addAssignmentForm) {
    addAssignmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = this.querySelector('input[type="text"]').value.trim();
        const subject = this.querySelector('select').value;
        const faculty = this.querySelectorAll('input[type="text"]')[1].value.trim();
        const description = this.querySelector('textarea').value.trim();
        const dueDate = this.querySelector('input[type="date"]').value;
        
        if (title && subject && faculty && description && dueDate) {
            console.log('New Assignment:', { title, subject, faculty, description, dueDate });
            alert('Assignment added successfully!');
            this.reset();
            closeModal('addAssignment');
        }
    });
}

const updateTimingForm = document.querySelector('#updateTiming form');
if (updateTimingForm) {
    updateTimingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const day = this.querySelectorAll('select')[0].value;
        const timeSlot = this.querySelectorAll('select')[1].value;
        const subject = this.querySelector('input[type="text"]').value.trim();
        const faculty = this.querySelectorAll('input[type="text"]')[1].value.trim();
        const room = this.querySelectorAll('input[type="text"]')[2].value.trim();
        const reason = this.querySelector('textarea').value.trim();
        
        if (day && timeSlot && subject && faculty && room) {
            console.log('Update Timing:', { day, timeSlot, subject, faculty, room, reason });
            alert('Timing updated successfully!');
            this.reset();
            closeModal('updateTiming');
        }
    });
}

function addNotificationToPage(title, message, priority) {
    const notificationsTab = document.querySelector('#notifications .card');
    if (!notificationsTab) return;
    
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item unread';
    
    let icon = '📢';
    if (priority === 'Important') icon = '⚠️';
    if (priority === 'Urgent') icon = '🚨';
    
    notificationItem.innerHTML = `
        <div class="notification-content">
            <h4>${icon} ${title}</h4>
            <p>${message}</p>
            <div class="notification-time">Posted by CR - Just now</div>
        </div>
    `;
    
    const firstNotification = notificationsTab.querySelector('.notification-item');
    if (firstNotification) {
        firstNotification.parentNode.insertBefore(notificationItem, firstNotification);
    } else {
        notificationsTab.appendChild(notificationItem);
    }
    
    notificationItem.addEventListener('click', function() {
        this.classList.remove('unread');
        updateNotificationBadge();
    });
    
    updateNotificationBadge();
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.textContent === 'Send Alert') {
        const row = e.target.closest('tr');
        if (row) {
            const studentName = row.querySelector('td:nth-child(2)').textContent;
            if (confirm(`Send attendance alert to ${studentName}?`)) {
                alert(`Alert sent to ${studentName} successfully!`);
                e.target.textContent = 'Alert Sent';
                e.target.disabled = true;
                e.target.style.opacity = '0.6';
                e.target.style.cursor = 'not-allowed';
            }
        }
    }

    if (e.target && e.target.textContent === 'Mark Complete') {
        const card = e.target.closest('.assignment-card');
        if (card) {
            const taskTitle = card.querySelector('.assignment-title').textContent;
            if (confirm(`Mark "${taskTitle}" as complete?`)) {
                const dueBadge = card.querySelector('.assignment-due');
                if (dueBadge) {
                    dueBadge.textContent = 'Completed';
                    dueBadge.classList.add('completed');
                }
                
                e.target.textContent = 'Completed';
                e.target.classList.remove('btn-success');
                e.target.classList.add('btn-secondary');
                e.target.disabled = true;
                e.target.style.opacity = '0.6';
                e.target.style.cursor = 'not-allowed';
                
                alert('Task marked as complete!');
            }
        }
    }
});

window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(function() {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('%c🎓 ClassHub - Class Management System', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cWelcome to the Class Management System!', 'color: #764ba2; font-size: 14px;');
console.log('%cDeveloped for CSE 2nd Year Mini Project', 'color: #94a3b8; font-size: 12px;');

const ClassHub = {
    saveData: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    getData: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    removeData: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    clearAll: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClassHub;
}