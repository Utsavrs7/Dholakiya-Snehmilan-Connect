require("dotenv").config();
const bcrypt = require("bcryptjs");
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
      return { ok: false, reason: "missing_env" };
    }

    const exists = await User.findOne({ role: "super_admin" });
    if (exists) {
      console.log("Super admin already exists. Skipping.");
      return { ok: true, skipped: true };
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
    return { ok: true, created: true };
  } catch (err) {
    console.error("Seed failed:", err.message);
    return { ok: false, reason: "seed_failed", error: err.message };
  }
};

// Execute the seed script
module.exports = run;
