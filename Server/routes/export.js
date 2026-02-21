const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { authRequired, roleRequired } = require("../src/middleware/auth");

// Get filter options (standards, villages, mediums)
router.get("/filter-options", authRequired, roleRequired("super_admin"), exportController.getFilterOptions);

// Preview results (without export)
router.post("/preview", authRequired, roleRequired("super_admin"), exportController.previewResults);

// Export results (PDF or Excel)
router.post("/results", authRequired, roleRequired("super_admin"), exportController.exportResults);

module.exports = router;

