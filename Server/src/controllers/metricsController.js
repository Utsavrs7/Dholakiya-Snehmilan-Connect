const VisitorCounter = require("../models/VisitorCounter");

const trackVisitor = async (req, res, next) => {
  try {
    const updated = await VisitorCounter.findOneAndUpdate(
      { key: "site" },
      { $inc: { count: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ count: updated.count });
  } catch (err) {
    next(err);
  }
};

const getVisitorCount = async (req, res, next) => {
  try {
    const item = await VisitorCounter.findOne({ key: "site" });
    res.json({ count: item?.count || 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  trackVisitor,
  getVisitorCount,
};
