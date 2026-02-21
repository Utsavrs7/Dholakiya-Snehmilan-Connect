const School = require("../models/School");

// Get all schools
const getSchools = async (req, res, next) => {
  try {
    const schools = await School.find().sort({ name: 1 });
    res.json(schools);
  } catch (err) {
    next(err);
  }
};

// Create a new school (admin only)
const createSchool = async (req, res, next) => {
  try {
    const { name, category, result_pattern } = req.body;
    if (!name || !category || !result_pattern) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const school = await School.create({ name, category, result_pattern });
    res.status(201).json(school);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchools,
  createSchool,
};
