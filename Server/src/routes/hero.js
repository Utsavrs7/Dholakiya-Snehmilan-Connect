const router = require("express").Router();
const { authRequired, roleRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getPublicHeroSlides,
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} = require("../controllers/heroController");

// Public hero slides
router.get("/", getPublicHeroSlides);

// Admin hero slides
router.get("/admin", authRequired, roleRequired("super_admin"), getAdminHeroSlides);
router.post("/", authRequired, roleRequired("super_admin"), upload.single("image"), createHeroSlide);
router.patch("/:id", authRequired, roleRequired("super_admin"), upload.single("image"), updateHeroSlide);
router.delete("/:id", authRequired, roleRequired("super_admin"), deleteHeroSlide);

module.exports = router;
