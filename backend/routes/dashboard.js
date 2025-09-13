const express = require("express");
const router = express.Router();
const personalization = require("../controllers/personalizationController");

router.get("/", personalization.dashboard);
router.put("/preferences", personalization.updatePreferences);
router.get("/recommendations", personalization.recommendations);

module.exports = router;

