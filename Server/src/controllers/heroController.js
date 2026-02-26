const HeroSlide = require("../models/HeroSlide");
const { emitUpdate } = require("../services/realtime");
const { getUploadedImageUrl } = require("../services/imageStorage");

// Public: list active hero slides
const getPublicHeroSlides = async (req, res, next) => {
  try {
    const data = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Admin: list all hero slides
const getAdminHeroSlides = async (req, res, next) => {
  try {
    const data = await HeroSlide.find().sort({ order: 1, createdAt: -1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Normalize boolean from form data
const toBool = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

// Admin: create hero slide (file or URL)
const createHeroSlide = async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, order, isActive } = req.body;
    const fileUrl = await getUploadedImageUrl(req.file, "snehmilan-connect/hero");
    const finalUrl = fileUrl || imageUrl;
    if (!finalUrl) {
      return res.status(400).json({ message: "Image file or URL is required" });
    }
    const created = await HeroSlide.create({
      title: title || "",
      subtitle: subtitle || "",
      imageUrl: finalUrl,
      order: Number(order) || 0,
      isActive: isActive !== undefined ? toBool(isActive) : true,
      createdBy: req.user?.id,
    });
    emitUpdate("hero");
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Admin: update hero slide
const updateHeroSlide = async (req, res, next) => {
  try {
    const item = await HeroSlide.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Hero slide not found" });
    const { title, subtitle, imageUrl, order, isActive } = req.body;
    if (req.file) {
      item.imageUrl = await getUploadedImageUrl(req.file, "snehmilan-connect/hero");
    } else if (imageUrl) {
      item.imageUrl = imageUrl;
    }
    if (title !== undefined) item.title = title;
    if (subtitle !== undefined) item.subtitle = subtitle;
    if (order !== undefined) item.order = Number(order);
    if (isActive !== undefined) item.isActive = toBool(isActive);
    const saved = await item.save();
    emitUpdate("hero");
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

// Admin: delete hero slide
const deleteHeroSlide = async (req, res, next) => {
  try {
    const item = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Hero slide not found" });
    emitUpdate("hero");
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicHeroSlides,
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
};
