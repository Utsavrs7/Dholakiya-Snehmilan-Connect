const router = require("express").Router();
const { authRequired, roleRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  submitResult,
  getMyResults,
  getMyResultTracking,
  resubmitMyResult,
  getAdminResults,
  getAdminResultById,
  updateAdminResult,
  getAdminSummary,
  getAdminResultsList,
  extractDataFromPhoto,
} = require("../controllers/resultController");

// Result submission requires login
router.post("/", authRequired, upload.single("photo"), submitResult);
router.get("/me", authRequired, getMyResults);
router.get("/me/:id/tracking", authRequired, getMyResultTracking);
router.patch("/me/:id/resubmit", authRequired, upload.single("photo"), resubmitMyResult);
// Admin results access (super_admin: all, village_admin: own village)
router.get("/admin", authRequired, roleRequired("super_admin", "village_admin"), getAdminResults);
// Super admin summary (counts per village)
router.get("/admin/summary", authRequired, roleRequired("super_admin"), getAdminSummary);
// Super admin list with filters + pagination
router.get("/admin/list", authRequired, roleRequired("super_admin"), getAdminResultsList);
// Admin single result access (role + village guard)
router.get("/admin/:id", authRequired, roleRequired("super_admin", "village_admin"), getAdminResultById);
// Admin update result (status + safe fields)
router.patch("/admin/:id", authRequired, roleRequired("super_admin", "village_admin"), updateAdminResult);

// Extract data from photo
router.post("/extract", upload.single("photo"), extractDataFromPhoto);

module.exports = router;
