const mongoose = require('mongoose');
const uri = "mongodb+srv://vaibhavagg:vaibhavcoc8888@project1.uaar6mv.mongodb.net/classhub?appName=Project1";
mongoose.connect(uri).then(async () => {
    const Timetable = mongoose.model('Timetable', new mongoose.Schema({}, { strict: false }));
    const tts = await Timetable.find();
    console.log("Total timetables:", tts.length);
    if(tts.length > 0) {
        tts.forEach((t, i) => {
             console.log(`Timetable ${i}: Monday slots = ${t.get('Monday') ? t.get('Monday').length : 'NONE'}`);
        });
    }
    process.exit(0);
});
