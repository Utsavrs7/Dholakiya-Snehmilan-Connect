const mongoose = require("mongoose");

// User model for website login/signup
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female"], default: "Male" },
    village: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    // Forgot-password OTP is stored as hash + expiry (never plain OTP in DB)
    forgotPasswordOtpHash: { type: String, default: null },
    forgotPasswordOtpExpiresAt: { type: Date, default: null },
    forgotPasswordOtpChannel: { type: String, enum: ["email", "mobile", null], default: null },
    forgotPasswordOtpTarget: { type: String, default: null },
    // Forgot-password abuse protection controls
    forgotPasswordOtpLastSentAt: { type: Date, default: null },
    forgotPasswordOtpFailedAttempts: { type: Number, default: 0 },
    forgotPasswordOtpLockedUntil: { type: Date, default: null },
    role: { type: String, enum: ["user", "super_admin", "village_admin"], default: "user" },
    accountStatus: { type: String, enum: ["pending", "active", "rejected"], default: "active" },
    approvalRequired: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Track last login for active status
    lastLogin: { type: Date, default: null },
    // Bump this to force token/session invalidation for a user.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
