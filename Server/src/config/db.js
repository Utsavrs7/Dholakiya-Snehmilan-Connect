const mongoose = require("mongoose");
const User = require("../models/User");

const ensureUserRoleScopedEmailIndex = async () => {
  const collection = User.collection;
  const indexes = await collection.indexes();
  const legacyEmailIndex = indexes.find((idx) => idx?.name === "email_1" && idx?.unique);
  if (legacyEmailIndex) {
    await collection.dropIndex("email_1");
    console.log("Dropped legacy unique index: email_1");
  }

  const roleEmailIndex = indexes.find((idx) => idx?.name === "role_1_email_1");
  if (roleEmailIndex && !roleEmailIndex.unique) {
    await collection.dropIndex("role_1_email_1");
  }

  await collection.createIndex(
    { role: 1, email: 1 },
    {
      name: "role_1_email_1",
      unique: true,
      partialFilterExpression: {
        email: { $type: "string", $ne: "" },
      },
    }
  );
  console.log("Ensured role-scoped unique index: role_1_email_1");
};

// Connect to MongoDB
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");
  await mongoose.connect(uri);
  await ensureUserRoleScopedEmailIndex();
  console.log("MongoDB connected");
};

module.exports = connectDB;
