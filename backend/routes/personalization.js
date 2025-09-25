const express = require("express");
const router = express.Router();
const controller = require("../controllers/personalizationController");

// GET /api/personalization/dashboard?username=NAME
router.get("/dashboard", controller.dashboard);

// PUT /api/personalization/preferences
router.put("/preferences", controller.updatePreferences);

// POST /api/personalization/activity/search
router.post("/activity/search", controller.recordSearch);
router.delete("/activity/search", controller.deleteRecentSearch);

// POST /api/personalization/activity/bid
router.post("/activity/bid", controller.recordBid);

router.post("/save-comparison", controller.saveComparison);
router.delete("/save-comparison", controller.deleteSavedComparison);

router.get("/saved-comparisons", controller.savedComparisons);

// GET /api/personalization/recommendations
// Heuristics: based on recent bids/searches/persona and devicePreference
router.get("/recommendations", controller.recommendations);

module.exports = router;
