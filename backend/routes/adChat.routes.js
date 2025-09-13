const express = require("express");
const router = express.Router();
const AdChatMessage = require("../models/AdChatMessage");

// GET inbox for a seller: latest message per {adId, buyerUsername}
router.get("/inbox", async (req, res) => {
  try {
    const seller = req.query.seller;
    if (!seller) return res.status(400).json({ error: "seller is required" });

    const latest = await AdChatMessage.aggregate([
      { $match: { sellerUsername: seller } },
      { $sort: { ts: -1 } },
      {
        $group: {
          _id: { adId: "$adId", buyerUsername: "$buyerUsername" },
          adId: { $first: "$adId" },
          buyerUsername: { $first: "$buyerUsername" },
          productTitle: { $first: "$productTitle" },
          lastMessage: { $first: "$message" },
          lastFrom: { $first: "$from" },
          ts: { $first: "$ts" },
        },
      },
      { $sort: { ts: -1 } },
    ]);

    res.json(latest);
  } catch (e) {
    console.error("inbox error", e);
    res.status(500).json({ error: "failed to load inbox" });
  }
});

// GET thread for seller+buyer+ad
router.get("/thread", async (req, res) => {
  try {
    const { adId, seller, buyer } = req.query;
    if (!adId || !seller || !buyer)
      return res.status(400).json({ error: "adId, seller, buyer required" });
    const msgs = await AdChatMessage.find({
      adId,
      sellerUsername: seller,
      buyerUsername: buyer,
    }).sort({ ts: 1 });
    res.json(msgs);
  } catch (e) {
    console.error("thread error", e);
    res.status(500).json({ error: "failed to load thread" });
  }
});

// POST send
router.post("/send", async (req, res) => {
  try {
    const { adId, productTitle, sellerUsername, buyerUsername, from, message } =
      req.body || {};
    if (!adId || !sellerUsername || !buyerUsername || !from || !message) {
      return res.status(400).json({ error: "missing fields" });
    }
    const doc = await AdChatMessage.create({
      adId,
      productTitle,
      sellerUsername,
      buyerUsername,
      from,
      message,
    });
    try {
      const io = req.app && req.app.get && req.app.get("io");
      if (io) {
        // Emit once to the union of all intended rooms to prevent duplicates
        const rooms = [
          `userName:${buyerUsername}`,
          `userName:${sellerUsername}`,
          `ad:${adId}`,
        ];
        io.to(rooms).emit("adChat:message", doc);
      }
    } catch {}
    res.status(201).json(doc);
  } catch (e) {
    console.error("send error", e);
    res.status(500).json({ error: "failed to send" });
  }
});

module.exports = router;
