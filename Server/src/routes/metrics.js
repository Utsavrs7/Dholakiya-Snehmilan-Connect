const express = require("express");
const { trackVisitor, getVisitorCount } = require("../controllers/metricsController");

const router = express.Router();

router.post("/visitors", trackVisitor);
router.get("/visitors", getVisitorCount);

module.exports = router;
