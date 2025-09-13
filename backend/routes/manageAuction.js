const express = require("express");
const router = express.Router();
const adController = require("../controllers/adController");
const adChatRoutes = require("./adChat.routes");

// Ads belonging to a seller
router.get("/ads/:username", adController.getAdsByUser);

// Close or delete an ad
router.post("/ad/:id/close", adController.closeAd);
router.delete("/ad/:id", adController.deleteAd);

// Mount existing ad chat endpoints under manage-auction as well
router.use("/ad-chat", adChatRoutes);

module.exports = router;

