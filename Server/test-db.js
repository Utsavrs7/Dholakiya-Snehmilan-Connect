require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log("MONGO_URI:", uri);

if (!uri) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log("Connected successfully");
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection failed:", err);
        process.exit(1);
    });
