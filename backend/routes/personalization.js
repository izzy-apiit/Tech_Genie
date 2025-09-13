const express = require("express");
const router = express.Router();
const controller = require("../controllers/personalizationController");

// GET /api/personalization/dashboard?username=NAME
router.get("/dashboard", controller.dashboard);

// PUT /api/personalization/preferences
router.put("/preferences", controller.updatePreferences);

// POST /api/personalization/activity/search
router.post("/activity/search", controller.recordSearch);

// POST /api/personalization/activity/bid
router.post("/activity/bid", controller.recordBid);

router.post("/save-comparison", controller.saveComparison);

router.get("/saved-comparisons", controller.savedComparisons);

// GET /api/personalization/recommendations
// Heuristics: based on recent bids/searches/persona and devicePreference
router.get("/recommendations", controller.recommendations);

module.exports = router;
