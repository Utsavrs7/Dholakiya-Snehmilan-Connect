const mongoose = require("mongoose");

// Announcement model
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ["normal", "high"], default: "normal" },
    isActive: { type: Boolean, default: true },
    showSubmitButton: { type: Boolean, default: false },
    submitButtonLabel: { type: String, trim: true, default: "Submit Result" },
    onlyIfResultNotSubmitted: { type: Boolean, default: false },
    eventDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
