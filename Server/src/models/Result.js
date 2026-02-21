const mongoose = require("mongoose");

// Result model (matches SubmitResult form fields)
const resultSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    standard: { type: String, required: true },
    semester: { type: String, default: "" },
    percentage: { type: Number, required: true },
    medium: { type: String, required: true },
    village: { type: String, required: true },
    result_details: { type: String, default: "" },
    photo: { type: String, required: true },
    status: { type: String, enum: ["pending", "reviewed", "accepted", "rejected"], default: "pending" },
    reject_note: { type: String, default: "", trim: true },
    status_history: [
      {
        status: {
          type: String,
          enum: ["submitted", "pending", "reviewed", "accepted", "rejected"],
          required: true,
        },
        note: { type: String, default: "", trim: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submitted_by_role: {
      type: String,
      enum: ["user", "super_admin", "village_admin"],
      default: "user",
    },
    submitted_by_name: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);
