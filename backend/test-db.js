const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing connection to MongoDB...');
console.log('URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 })
    .then(() => {
        console.log('✅ Success! Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed to connect:', err.message);
        process.exit(1);
    });
