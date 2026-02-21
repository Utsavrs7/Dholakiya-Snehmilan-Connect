const mongoose = require("mongoose");

// School model for categorizing schools and their result patterns
const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true }, // e.g., "Grade-Based", "Percentage-Based", "Mixed"
    result_pattern: { type: String, enum: ["percentage", "grade", "mixed"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", schoolSchema);
