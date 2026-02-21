const Announcement = require("../models/Announcement");
const { emitUpdate } = require("../services/realtime");

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const parseDate = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const listAnnouncementsSorted = async (match = {}) => {
  const pipeline = [];
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  pipeline.push(
    {
      $addFields: {
        priorityRank: {
          $cond: [{ $eq: ["$priority", "high"] }, 1, 0],
        },
      },
    },
    { $sort: { priorityRank: -1, createdAt: -1 } },
    { $project: { priorityRank: 0 } }
  );
  return Announcement.aggregate(pipeline);
};

// Public: list active announcements
const getPublicAnnouncements = async (req, res, next) => {
  try {
    const data = await listAnnouncementsSorted({ isActive: true });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Admin: list all announcements
const getAdminAnnouncements = async (req, res, next) => {
  try {
    const data = await listAnnouncementsSorted();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Admin: create announcement
const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      message,
      priority,
      isActive,
      showSubmitButton,
      submitButtonLabel,
      onlyIfResultNotSubmitted,
      eventDate,
    } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    const created = await Announcement.create({
      title,
      message,
      priority: priority || "normal",
      isActive: parseBoolean(isActive, true),
      showSubmitButton: parseBoolean(showSubmitButton, false),
      submitButtonLabel: submitButtonLabel || "Submit Result",
      onlyIfResultNotSubmitted: parseBoolean(onlyIfResultNotSubmitted, false),
      eventDate: parseDate(eventDate),
      createdBy: req.user?.id,
    });
    emitUpdate("announcements");
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Admin: update announcement
const updateAnnouncement = async (req, res, next) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    const {
      title,
      message,
      priority,
      isActive,
      showSubmitButton,
      submitButtonLabel,
      onlyIfResultNotSubmitted,
      eventDate,
    } = req.body;
    if (title !== undefined) item.title = title;
    if (message !== undefined) item.message = message;
    if (priority !== undefined) item.priority = priority;
    if (isActive !== undefined) item.isActive = parseBoolean(isActive, item.isActive);
    if (showSubmitButton !== undefined) {
      item.showSubmitButton = parseBoolean(showSubmitButton, item.showSubmitButton);
    }
    if (submitButtonLabel !== undefined) {
      item.submitButtonLabel = submitButtonLabel || "Submit Result";
    }
    if (onlyIfResultNotSubmitted !== undefined) {
      item.onlyIfResultNotSubmitted = parseBoolean(
        onlyIfResultNotSubmitted,
        item.onlyIfResultNotSubmitted
      );
    }
    if (eventDate !== undefined) {
      item.eventDate = parseDate(eventDate) || null;
    }
    const saved = await item.save();
    emitUpdate("announcements");
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

// Admin: delete announcement
const deleteAnnouncement = async (req, res, next) => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    emitUpdate("announcements");
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
