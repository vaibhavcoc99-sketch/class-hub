const timetableData = {
  Monday: [
    {
      time: "02:00 - 03:40",
      subject: "Operating System",
      faculty: "Ass. Dipanshu Singh",
      room: "Lt 21",
      isBreak: false
    }
  ]
};
const suspendedSlotsStudent = new Set();
const suspensionsList = [];
function isSlotSuspended(day, slot) { return false; }

function renderFullTimetable() {
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
    console.log(html.includes("Operating System"));
}
renderFullTimetable();
