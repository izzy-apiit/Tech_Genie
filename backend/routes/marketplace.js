const express = require("express");
const router = express.Router();
const adController = require("../controllers/adController");
const personalization = require("../controllers/personalizationController");

// Marketplace listing
router.get("/ads", adController.getAllAds);

// Recommendations for marketplace
router.get("/recommendations", personalization.recommendations);

module.exports = router;

