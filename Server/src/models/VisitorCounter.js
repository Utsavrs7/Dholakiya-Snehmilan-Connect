const mongoose = require("mongoose");

const visitorCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitorCounter", visitorCounterSchema);
