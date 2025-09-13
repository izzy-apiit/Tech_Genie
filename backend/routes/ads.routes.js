const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const adController = require("../controllers/adController");
const adsController = require("../controllers/ads.controller");

// 👉 More specific routes first
router.get("/user/:username", adController.getAdsByUser);
router.get("/bids/user/:username", adsController.getAdsByUser);

// 👉 Core ad routes
router.get("/", adController.getAllAds);
router.post("/:id/bid", adController.bidOnAd);
router.post("/:id/close", adController.closeAd);
router.delete("/:id", adController.deleteAd);
router.get("/:id", adController.getAdById);

// ✅ Only this line for posting ads
router.post("/", upload.array("images", 5), adController.createAd);

module.exports = router;
