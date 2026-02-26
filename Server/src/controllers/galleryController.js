const GalleryImage = require("../models/GalleryImage");
const { emitUpdate } = require("../services/realtime");
const { getUploadedImageUrl } = require("../services/imageStorage");

// Public: list gallery images
const getGallery = async (req, res, next) => {
  try {
    const data = await GalleryImage.find({ category: { $ne: "slider" } }).sort({
      createdAt: -1,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Admin: create gallery image (file or URL)
const createGalleryImage = async (req, res, next) => {
  try {
    const { title, category, imageUrl } = req.body;
    // Image from multer (file) or URL
    const fileUrl = await getUploadedImageUrl(req.file, "snehmilan-connect/gallery");
    const finalUrl = fileUrl || imageUrl;
    if (!finalUrl) {
      return res.status(400).json({ message: "Image file or URL is required" });
    }
    const created = await GalleryImage.create({
      title: title || "",
      category: category || "snehmilan",
      imageUrl: finalUrl,
      createdBy: req.user?.id,
    });
    emitUpdate("gallery");
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Admin: update gallery image meta or replace image
const updateGalleryImage = async (req, res, next) => {
  try {
    const item = await GalleryImage.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Image not found" });
    const { title, category, imageUrl } = req.body;
    // If file provided, replace imageUrl
    if (req.file) {
      item.imageUrl = await getUploadedImageUrl(req.file, "snehmilan-connect/gallery");
    } else if (imageUrl) {
      item.imageUrl = imageUrl;
    }
    if (title !== undefined) item.title = title;
    if (category !== undefined) item.category = category;
    const saved = await item.save();
    emitUpdate("gallery");
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

// Admin: delete gallery image
const deleteGalleryImage = async (req, res, next) => {
  try {
    const item = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Image not found" });
    emitUpdate("gallery");
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
};
