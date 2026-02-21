const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { authRequired, roleRequired } = require("../middleware/auth");
const {
  submitResult,
  getMyResults,
  getMyResultTracking,
  getAdminResults,
  getAdminResultById,
  updateAdminResult,
  getAdminSummary,
  getAdminResultsList,
  extractDataFromPhoto,
} = require("../controllers/resultController");

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Result submission requires login
router.post("/", authRequired, upload.single("photo"), submitResult);
router.get("/me", authRequired, getMyResults);
router.get("/me/:id/tracking", authRequired, getMyResultTracking);
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
