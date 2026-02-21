const mongoose = require("mongoose");

const villageOverrideSchema = new mongoose.Schema(
  {
    village: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const approvalSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    globalEnabled: { type: Boolean, default: true },
    villageOverrides: { type: [villageOverrideSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalSetting", approvalSettingSchema);
