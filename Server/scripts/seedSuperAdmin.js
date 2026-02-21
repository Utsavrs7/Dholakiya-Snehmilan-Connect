require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");

// One-time seed script: create the first super admin safely
const run = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || "Dholakiya Super Admin";
    const mobile = process.env.SUPER_ADMIN_MOBILE || "";
    const village = process.env.SUPER_ADMIN_VILLAGE || "";

    if (!email || !password) {
      console.error("Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    await connectDB();

    const exists = await User.findOne({ role: "super_admin" });
    if (exists) {
      console.log("Super admin already exists. Skipping.");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash,
      role: "super_admin",
      mobile,
      village,
    });

    console.log("Super admin created:", { id: user._id.toString(), email: user.email });
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

// Execute the seed script
run();
