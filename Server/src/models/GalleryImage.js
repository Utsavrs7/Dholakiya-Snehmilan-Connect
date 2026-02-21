const mongoose = require("mongoose");

// Gallery image model
const galleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    category: { type: String, default: "snehmilan" },
    imageUrl: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryImage", galleryImageSchema);
