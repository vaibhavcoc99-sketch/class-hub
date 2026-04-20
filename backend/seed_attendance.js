const mongoose = require('mongoose');
const StudentStats = require('./models/StudentStats');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const TOTAL_CLASSES = 20;

const subjects = [
    'Operating System',
    'OOps using JAVA',
    'Automata',
    'Operating System Lab',
    'OOps using JAVA Lab',
    'Python Lab',
    'Mini Project',
    'Python',
    'Sensor & Instrumentation'
];

const GLOBAL_STUDENT_LIST = [
    { rollNo: '2400520100001', name: 'AASTHA GAUR' },
    { rollNo: '2400520100002', name: 'ABHINAV MANI TRIPATHI' },
    { rollNo: '2400520100003', name: 'ABHINAV PAL' },
    { rollNo: '2400520100004', name: 'ABHINAV SINGH' },
    { rollNo: '2400520100005', name: 'ABHISHEK' },
    { rollNo: '2400520100006', name: 'ABHISHEK YADAV' },
    { rollNo: '2400520100007', name: 'ABHIST KUMBHAJ PANDEY' },
    { rollNo: '2400520100008', name: 'ADITYA MISHRA' },
    { rollNo: '2400520100009', name: 'ADITYA PAL' },
    { rollNo: '2400520100010', name: 'ADITYA PANDAY' },
    { rollNo: '2400520100011', name: 'ALOK SHARMA' },
    { rollNo: '2400520100012', name: 'AMAN KUSHWAHA' },
    { rollNo: '2400520100013', name: 'AMAN YADAV' },
    { rollNo: '2400520100014', name: 'ANKIT PRAJAPATI' },
    { rollNo: '2400520100015', name: 'ANKUSH SINGH' },
    { rollNo: '2400520100016', name: 'ANSH SHARMA' },
    { rollNo: '2400520100017', name: 'ANSHUMAN SINGH' },
    { rollNo: '2400520100018', name: 'ANTRIKSHYA GUPTA' },
    { rollNo: '2400520100019', name: 'ANUJ AGRAWAL' },
    { rollNo: '2400520100020', name: 'ANUSHAKA PRASAD' },
    { rollNo: '2400520100021', name: 'ARCHIT SAXENA' },
    { rollNo: '2400520100022', name: 'ARYA MISHRA' },
    { rollNo: '2400520100023', name: 'ARYAN SHUKLA' },
    { rollNo: '2400520100024', name: 'ATUL KUMAR' },
    { rollNo: '2400520100025', name: 'AYUSH RASTOGI' },
    { rollNo: '2400520100026', name: 'AYUSH SHARMA' },
    { rollNo: '2400520100027', name: 'AYUSHMAN AGRAHARI' },
    { rollNo: '2400520100028', name: 'BHAVYA NIGAM' },
    { rollNo: '2400520100029', name: 'DARSHIKA SINGH' },
    { rollNo: '2400520100030', name: 'DEEPANSHU LAMBA' },
    { rollNo: '2400520100031', name: 'DEVANSH GUPTA' },
    { rollNo: '2400520100032', name: 'DEVANSH SINGH' },
    { rollNo: '2400520100033', name: 'DEVENDRA SINGH' },
    { rollNo: '2400520100034', name: 'DEVRAJ GUPTA' },
    { rollNo: '2400520100035', name: 'DIPAYAN ROY' },
    { rollNo: '2400520100036', name: 'GOVIND SINGH' },
    { rollNo: '2400520100037', name: 'GUNJAN KUSHWAHA' },
    { rollNo: '2400520100038', name: 'HARSHIT YADAV' },
    { rollNo: '2400520100039', name: 'HEMENDRA SARASWAT' },
    { rollNo: '2400520100040', name: 'HIMANSHU' },
    { rollNo: '2400520100041', name: 'ISHANT KUMAR' },
    { rollNo: '2400520100042', name: 'KIRTI GUPTA' },
    { rollNo: '2400520100043', name: 'KOMAL' },
    { rollNo: '2400520100044', name: 'KRITIKA' },
    { rollNo: '2400520100045', name: 'KRRISH VERMA' },
    { rollNo: '2400520100046', name: 'KSHITIJ VARMA' },
    { rollNo: '2400520100047', name: 'LAKSHYA SRIVASTAVA' },
    { rollNo: '2400520100048', name: 'LOKENDRA SINGH' },
    { rollNo: '2400520100049', name: 'MALAY VARSHNEY' },
    { rollNo: '2400520100050', name: 'MAYANK BHARDWAJ' },
    { rollNo: '2400520100051', name: 'MEGHA VERMA' },
    { rollNo: '2400520100052', name: 'MOHAMMED ATIF' },
    { rollNo: '2400520100053', name: 'PARTH MISHRA' },
    { rollNo: '2400520100054', name: 'PRAJIT KUMAR SINGH' },
    { rollNo: '2400520100055', name: 'PRANSHU SINGH' },
    { rollNo: '2400520100056', name: 'PRATEEK GOYAL' },
    { rollNo: '2400520100057', name: 'PRIYANSHU Sharma' },
    { rollNo: '2400520100058', name: 'PRIYANSHU' },
    { rollNo: '2400520100059', name: 'PRIYANSHU GAUTAM' },
    { rollNo: '2400520100060', name: 'RACHIT GAUR' },
    { rollNo: '2400520100061', name: 'RITIK SHARMA' },
    { rollNo: '2400520100062', name: 'SACHIN SRIVASTAVA' },
    { rollNo: '2400520100063', name: 'SACHLANG DEBBARMA' },
    { rollNo: '2400520100064', name: 'SAMYAK JAIN' },
    { rollNo: '2400520100065', name: 'SHANTANU SINGH' },
    { rollNo: '2400520100066', name: 'SHASHWAT GANGWAR' },
    { rollNo: '2400520100067', name: 'SUMIT RAWAT' },
    { rollNo: '2400520100068', name: 'TARUN KUMAR' },
    { rollNo: '2400520100069', name: 'TAVISHI JAIN' },
    { rollNo: '2400520100070', name: 'UMANG RANA' },
    { rollNo: '2400520100071', name: 'VAIBHAV AGARWAL' },
    { rollNo: '2400520100072', name: 'VAISHNAVI BATHAM' },
    { rollNo: '2400520100073', name: 'VANSH SINGH' },
    { rollNo: '2400520100074', name: 'VIDUSHI PANDEY' },
    { rollNo: '2400520100075', name: 'VIRENDRA KUMAR' },
    { rollNo: '2400520100076', name: 'VISHESH TIWARI' },
    { rollNo: '2400520100077', name: 'YADAV ABHISHEK DILIP' },
    { rollNo: '2400520100078', name: 'YASH JAISWAL' },
    { rollNo: '2400520100079', name: 'YASH KUMAR' }
];

// Extracted from user screenshots (79 rows x 9 subjects)
const rawData = [
    ["2400520100001", 19, 15, 16, 15, 15, 16, 16, 15, 19],
    ["2400520100002", 18, 18, 17, 19, 15, 18, 15, 19, 18],
    ["2400520100003", 15, 16, 17, 18, 17, 17, 19, 19, 15],
    ["2400520100004", 16, 17, 18, 16, 19, 16, 16, 19, 16],
    ["2400520100005", 16, 17, 15, 19, 16, 17, 18, 15, 17],
    ["2400520100006", 15, 15, 18, 19, 17, 19, 15, 18, 19],
    ["2400520100007", 19, 15, 19, 15, 16, 15, 19, 16, 19],
    ["2400520100008", 18, 18, 19, 19, 15, 19, 19, 16, 19],
    ["2400520100009", 18, 17, 15, 18, 17, 15, 16, 16, 16],
    ["2400520100010", 16, 18, 16, 17, 17, 17, 18, 16, 16],
    ["2400520100011", 15, 19, 19, 19, 15, 15, 18, 17, 19],
    ["2400520100012", 16, 16, 16, 15, 19, 17, 19, 16, 15],
    ["2400520100013", 16, 17, 17, 19, 19, 18, 16, 15, 18],
    ["2400520100014", 18, 17, 18, 16, 18, 19, 15, 16, 18],
    ["2400520100015", 17, 16, 15, 18, 17, 18, 17, 19, 19],
    ["2400520100016", 17, 18, 15, 17, 17, 15, 15, 15, 16],
    ["2400520100017", 17, 16, 15, 18, 19, 17, 15, 17, 19],
    ["2400520100018", 17, 18, 16, 19, 15, 18, 18, 18, 16],
    ["2400520100019", 17, 17, 15, 19, 16, 17, 18, 17, 16],
    ["2400520100020", 16, 19, 17, 17, 18, 18, 19, 16, 18],
    ["2400520100021", 19, 19, 16, 17, 15, 16, 15, 19, 19],
    ["2400520100022", 15, 15, 15, 19, 16, 16, 19, 19, 17],
    ["2400520100023", 16, 16, 16, 15, 19, 17, 19, 15, 15],
    ["2400520100024", 17, 16, 17, 17, 17, 17, 18, 19, 19],
    ["2400520100025", 15, 18, 19, 17, 16, 16, 16, 19, 16],
    ["2400520100026", 15, 16, 17, 18, 19, 19, 15, 19, 16],
    ["2400520100027", 18, 16, 15, 16, 15, 16, 15, 18, 15],
    ["2400520100028", 16, 17, 19, 18, 18, 19, 16, 15, 19],
    ["2400520100029", 15, 18, 18, 18, 18, 15, 15, 16, 18],
    ["2400520100030", 16, 15, 18, 18, 16, 15, 18, 16, 19],
    ["2400520100031", 16, 19, 15, 16, 19, 17, 19, 19, 15],
    ["2400520100032", 15, 18, 18, 16, 16, 18, 15, 17, 18],
    ["2400520100033", 19, 16, 17, 16, 15, 16, 18, 19, 15],
    ["2400520100034", 18, 18, 17, 19, 15, 17, 18, 18, 19],
    ["2400520100035", 15, 16, 17, 16, 16, 17, 15, 19, 16],
    ["2400520100036", 18, 15, 19, 16, 17, 17, 18, 17, 17],
    ["2400520100037", 15, 15, 19, 15, 17, 18, 18, 17, 15],
    ["2400520100038", 19, 15, 19, 15, 19, 19, 17, 19, 17],
    ["2400520100039", 18, 17, 19, 19, 18, 19, 19, 15, 17],
    ["2400520100040", 16, 16, 18, 17, 16, 18, 15, 15, 17],
    ["2400520100041", 16, 15, 15, 16, 17, 18, 19, 15, 18],
    ["2400520100042", 18, 15, 18, 15, 17, 15, 17, 16, 15],
    ["2400520100043", 17, 19, 17, 15, 15, 19, 15, 15, 16],
    ["2400520100044", 19, 18, 18, 19, 17, 15, 15, 19, 19],
    ["2400520100045", 17, 15, 17, 16, 18, 16, 19, 16, 17],
    ["2400520100046", 17, 18, 19, 18, 16, 15, 15, 19, 19],
    ["2400520100047", 17, 17, 17, 16, 16, 18, 15, 16, 16],
    ["2400520100048", 18, 15, 18, 18, 15, 17, 15, 19, 15],
    ["2400520100049", 19, 19, 18, 16, 16, 16, 15, 17, 17],
    ["2400520100050", 19, 16, 19, 19, 19, 16, 17, 16, 18],
    ["2400520100051", 17, 19, 18, 17, 16, 17, 19, 19, 17],
    ["2400520100052", 15, 18, 18, 17, 19, 17, 18, 15, 17],
    ["2400520100053", 15, 19, 19, 15, 18, 18, 18, 18, 16],
    ["2400520100054", 19, 18, 18, 16, 15, 15, 15, 15, 18],
    ["2400520100055", 18, 15, 19, 18, 17, 15, 16, 15, 18],
    ["2400520100056", 16, 19, 18, 17, 19, 18, 18, 15, 19],
    ["2400520100057", 17, 18, 16, 17, 17, 15, 15, 18, 18],
    ["2400520100058", 18, 17, 19, 17, 16, 17, 15, 19, 19],
    ["2400520100059", 15, 18, 17, 19, 18, 19, 15, 15, 15],
    ["2400520100060", 16, 17, 17, 16, 15, 19, 16, 16, 15],
    ["2400520100061", 15, 15, 19, 17, 15, 16, 15, 19, 19],
    ["2400520100062", 16, 15, 15, 18, 19, 19, 18, 15, 15],
    ["2400520100063", 18, 15, 17, 18, 15, 15, 17, 18, 19],
    ["2400520100064", 15, 15, 17, 16, 16, 19, 17, 18, 16],
    ["2400520100065", 17, 16, 16, 17, 16, 17, 18, 17, 15],
    ["2400520100066", 17, 16, 19, 16, 18, 19, 16, 18, 15],
    ["2400520100067", 18, 15, 16, 16, 17, 17, 18, 17, 19],
    ["2400520100068", 19, 19, 17, 15, 19, 17, 17, 18, 16],
    ["2400520100069", 18, 17, 18, 15, 18, 17, 17, 17, 16],
    ["2400520100070", 15, 17, 19, 18, 17, 15, 19, 19, 17],
    ["2400520100071", 19, 15, 19, 19, 18, 15, 18, 15, 18],
    ["2400520100072", 19, 16, 17, 16, 16, 15, 17, 16, 19],
    ["2400520100073", 11, 13, 14, 10, 10, 12, 13, 13, 13],
    ["2400520100074", 11, 13, 14, 12, 13, 12, 12, 10, 12],
    ["2400520100075", 11, 13, 14, 11, 12, 14, 13, 14, 10],
    ["2400520100076", 14, 10, 13, 11, 12, 12, 12, 14, 10],
    ["2400520100077", 13, 11, 14, 12, 10, 11, 14, 11, 14],
    ["2400520100078", 10, 10, 12, 13, 11, 11, 13, 10, 12],
    ["2400520100079", 10, 12, 12, 12, 12, 11, 10, 12, 12]
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classhub');
        console.log('Connected to MongoDB');

        for (const row of rawData) {
            const rollNo = row[0];
            const statsArray = [];

            // Find name mapped to this roll no
            const studentMeta = GLOBAL_STUDENT_LIST.find(s => s.rollNo === rollNo);
            const studentName = studentMeta ? studentMeta.name : 'Unknown Student';

            for (let i = 0; i < subjects.length; i++) {
                statsArray.push({
                    subject: subjects[i],
                    totalClasses: TOTAL_CLASSES,
                    attendedClasses: row[i + 1]
                });
            }

            // Upsert into StudentStats explicitly detached from authentication!
            await StudentStats.updateOne(
                { rollNo: rollNo },
                { 
                    $set: { 
                        name: studentName,
                        attendanceStats: statsArray 
                    } 
                },
                { upsert: true }
            );
        }

        console.log('✅ Successfully seeded all 79 students into StudentStats with baseline attendance.');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        mongoose.disconnect();
    }
}

seed();
