const http = require('http');
http.get('http://localhost:5001/api/timetable', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.timetable) {
         console.log("Success! Timetable has keys:", Object.keys(parsed.timetable));
         console.log("Monday:", parsed.timetable.Monday ? parsed.timetable.Monday.length : 'missing');
      } else {
         console.log("Failed:", parsed);
      }
    } catch(e) {
      console.log("Error parsing:", e);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
