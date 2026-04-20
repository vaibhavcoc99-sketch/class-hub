const timetable = {
  "Monday": [
    { subject: "Operating System", time: "02:00 - 03:40" },
    { subject: "Ethical Research", time: "03:40 - 04:30" },
    { subject: "OOps using JAVA", time: "09:00 - 09:50" },
    { subject: "Mini Project", time: "09:10 - 10:50" },
    { subject: "Technical Communication", time: "10:50 - 11:40" },
    { subject: "Sensor & Instrumentation", time: "11:40 - 12:30" }
  ],
  "Tuesday": [
    { subject: "Operating System", time: "09:10 - 10:50" },
    { subject: "Automata", time: "10:50 - 12:30" },
    { subject: "Python Lab", time: "02:00 - 03:40" },
    { subject: "OOps in java", time: "03:40 - 04:30" }
  ],
  "Wednesday": [
    { subject: "Sensor & Instrumentation", time: "10:50 - 12:30" },
    { subject: "Python", time: "02:00 - 03:40" }
  ],
  "Thursday": [
    { subject: "Automata", time: "09:10 - 10:50" },
    { subject: "Technical Communication", time: "10:50 - 11:40" },
    { subject: "Ethical Research", time: "11:40 - 12:30" },
    { subject: "Operating System Lab", time: "02:00 - 03:40" }
  ],
  "Friday": [
    { subject: "OOps in java", time: "10:00 - 11:40" },
    { subject: "Technical Communication", time: "11:40 - 12:30" },
    { subject: "Sensor & Instrumentation", time: "02:00 - 03:40" },
    { subject: "Python", time: "03:40 - 04:30" }
  ]
};

function subjectMatchesFaculty(slotSubject, facultyDept) {
    if (!slotSubject || !facultyDept) return false;
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = norm(slotSubject);
    const b = norm(facultyDept);
    return a === b || a.includes(b) || b.includes(a);
}

const facultyDept = "Sensor & Instrumentation";
for (const day in timetable) {
    const slots = timetable[day];
    const mySlots = slots.filter(slot => subjectMatchesFaculty(slot.subject, facultyDept));
    if(mySlots.length > 0) {
        console.log(`Day: ${day}`);
        mySlots.forEach(s => console.log(`  - ${s.subject} at ${s.time}`));
    }
}
