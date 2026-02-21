const router = require("express").Router();
const { authRequired, roleRequired } = require("../middleware/auth");
const { getSchools, createSchool } = require("../controllers/schoolController");

// Get all schools (public for form dropdown)
router.get("/", getSchools);
// Create school (admin only)
router.post("/", authRequired, roleRequired("super_admin"), createSchool);

module.exports = router;
