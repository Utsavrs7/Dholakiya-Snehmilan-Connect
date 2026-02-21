const router = require("express").Router();
const { authRequired, roleRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} = require("../controllers/galleryController");

// Public gallery list
router.get("/", getGallery);

// Admin gallery actions
router.post("/", authRequired, roleRequired("super_admin"), upload.single("image"), createGalleryImage);
router.patch("/:id", authRequired, roleRequired("super_admin"), upload.single("image"), updateGalleryImage);
router.delete("/:id", authRequired, roleRequired("super_admin"), deleteGalleryImage);

module.exports = router;
