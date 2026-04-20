const mongoose = require('mongoose');
const SuspendedClass = require('./models/SuspendedClass');

mongoose.connect(process.env.MONGO_URI, { family: 4 }).then(async () => {
    await SuspendedClass.deleteMany({});
    console.log('Suspended classes cleared successfully.');
    process.exit(0);
});
