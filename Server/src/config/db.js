const mongoose = require("mongoose");
const User = require("../models/User");

const reconcileUserIndexesBestEffort = async () => {
  const collection = User.collection;
  try {
    const indexes = await collection.indexes();

    // Remove restrictive unique indexes so app-level role-scoped rules can work.
    const dropCandidates = ["email_1", "role_1_email_1"];
    for (const idxName of dropCandidates) {
      const idx = indexes.find((item) => item?.name === idxName);
      if (idx?.unique) {
        try {
          await collection.dropIndex(idxName);
          console.log(`Dropped legacy unique index: ${idxName}`);
        } catch (dropErr) {
          console.warn(`Could not drop index ${idxName}:`, dropErr.message);
        }
      }
    }

    // Non-unique helper indexes for fast duplicate checks in controllers.
    try {
      await collection.createIndex({ role: 1, email: 1 }, { name: "role_1_email_1" });
    } catch (idxErr) {
      console.warn("Could not ensure index role_1_email_1:", idxErr.message);
    }
    try {
      await collection.createIndex({ role: 1, mobile: 1 }, { name: "role_1_mobile_1" });
    } catch (idxErr) {
      console.warn("Could not ensure index role_1_mobile_1:", idxErr.message);
    }
  } catch (err) {
    console.warn("User index reconciliation skipped:", err.message);
  }
};

// Connect to MongoDB
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");
  await mongoose.connect(uri);
  await reconcileUserIndexesBestEffort();
  console.log("MongoDB connected");
};

module.exports = connectDB;
