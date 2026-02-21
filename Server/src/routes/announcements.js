const router = require("express").Router();
const { authRequired, roleRequired } = require("../middleware/auth");
const {
  getPublicAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

// Public announcements list
router.get("/", getPublicAnnouncements);

// Admin announcements list
router.get("/admin", authRequired, roleRequired("super_admin"), getAdminAnnouncements);
router.post("/", authRequired, roleRequired("super_admin"), createAnnouncement);
router.patch("/:id", authRequired, roleRequired("super_admin"), updateAnnouncement);
router.delete("/:id", authRequired, roleRequired("super_admin"), deleteAnnouncement);

module.exports = router;
