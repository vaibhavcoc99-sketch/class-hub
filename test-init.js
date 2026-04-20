const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('frontend/student.html', 'utf8');
const js = fs.readFileSync('frontend/js/student.js', 'utf8');
const dataJs = fs.readFileSync('frontend/js/data.js', 'utf8');

const { window } = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost:5001" });

// Mock localStorage
window.localStorage = {
  getItem: (k) => {
    if(k === 'classhub_token') return 'fake-token';
    if(k === 'classhub_user') return JSON.stringify({id: '123', rollNo: '2400520100071', role: 'student', name: 'Test'});
    return null;
  },
  setItem: () => {}
};

// Mock fetch
window.fetch = async (url) => {
  if (url.includes('/api/timetable')) return { json: async () => ({ success: true, timetable: { Monday: [{time:"10", subject:"Java"}], Tuesday: [] } }) };
  if (url.includes('/api/suspend-class')) return { json: async () => ({ success: true, suspensions: [] }) };
  if (url.includes('/api/internal-marks/student')) return { json: async () => ({ success: true, marks: [{subject:"Java", ct1: 10}] }) };
  if (url.includes('/api/announcements')) return { json: async () => ({ success: true, announcements: [] }) };
  if (url.includes('/api/assignments')) return { json: async () => ({ success: true, assignments: [] }) };
  if (url.includes('/api/submissions')) return { json: async () => ({ success: true, submissions: [] }) };
  if (url.includes('/api/attendance')) return { json: async () => ({ success: true, attendance: [] }) };
  return { json: async () => ({}) };
};

window.eval(dataJs);
window.eval(js);

window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

setTimeout(() => {
   console.log("Timetable HTML length:", window.document.getElementById('full-timetable').innerHTML.length);
   window.switchTab('analytics');
   setTimeout(() => {
       console.log("Internal marks empty text visible?", window.document.getElementById('internal-marks-empty').style.display);
       console.log("Internal marks HTML length:", window.document.getElementById('internal-marks-body').innerHTML.length);
   }, 500);
}, 500);
