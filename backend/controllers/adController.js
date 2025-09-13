const Ad = require("../models/Ad");

// Get all ads
exports.getAllAds = async (req, res) => {
  try {
    // Auto-close any ads whose endTime has passed
    await Ad.updateMany(
      { endTime: { $lte: new Date() }, isClosed: false },
      { $set: { isClosed: true } },
    );

    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ads" });
  }
};

// Get single ad by ID
exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    if (!ad.isClosed && ad.endTime && new Date(ad.endTime) <= new Date()) {
      ad.isClosed = true;
      await ad.save();
    }
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: "Error fetching ad" });
  }
};

// ✅ New: Create a new ad with image support
exports.createAd = async (req, res) => {
  try {
    const {
      deviceType,
      subcategory,
      brand,
      title,
      condition,
      mobile,
      description,
      price,
      duration,
      createdBy,
    } = req.body;

    const durationMap = {
      "12h": 12,
      "1d": 24,
      "2d": 48,
      "5d": 120,
      "10d": 240,
    };

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + (durationMap[duration] || 24));

    const images = req.files.map((file) => file.filename);

    const newAd = new Ad({
      deviceType,
      subcategory,
      brand,
      title,
      condition,
      mobile,
      description,
      price,
      duration,
      createdBy,
      endTime,
      images,
    });

    await newAd.save();

    res.status(201).json({ success: true, ad: newAd });
  } catch (err) {
    console.error("Error creating ad:", err);
    res.status(500).json({ success: false, error: "Failed to post ad" });
  }
};

// Bid on an ad
exports.bidOnAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    // Disallow bidding if auction is closed or expired
    if (ad.isClosed || (ad.endTime && new Date(ad.endTime) <= new Date())) {
      if (!ad.isClosed) {
        ad.isClosed = true;
        await ad.save();
      }
      return res.status(400).json({ error: "Auction has ended" });
    }

    const bid = {
      user: req.body.user,
      amount: req.body.amount,
    };

    // prevent owner from bidding on own ad
    if (bid.user && ad.createdBy && String(bid.user) === String(ad.createdBy)) {
      return res.status(403).json({ error: "Owner cannot bid on own product" });
    }

    // Determine previous highest bidder before adding the new bid
    const prevHighest = (ad.bids || []).reduce(
      (acc, b) => (b.amount > (acc?.amount || -Infinity) ? b : acc),
      null,
    );

    ad.bids.unshift(bid);
    await ad.save();

    // Emit realtime update to room for this ad (if socket.io available)
    try {
      const io = req.app && req.app.get && req.app.get("io");
      if (io) {
        io.to(`ad:${ad._id.toString()}`).emit("bidUpdate", ad);
        // Notify previous highest bidder that they have been outbid
        if (
          prevHighest &&
          Number(bid.amount) > Number(prevHighest.amount) &&
          prevHighest.user &&
          prevHighest.user !== bid.user
        ) {
          io.to(`userName:${prevHighest.user}`).emit("notify:outbid", {
            adId: ad._id.toString(),
            title: ad.title,
            yourBid: Number(prevHighest.amount),
            newBid: Number(bid.amount),
          });
        }
      }
    } catch (e) {
      // non-fatal if socket not available
    }

    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: "Failed to place bid" });
  }
};

// Close an auction
exports.closeAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad)
      return res.status(404).json({ success: false, error: "Ad not found" });
    ad.isClosed = true;
    await ad.save();
    try {
      const io = req.app && req.app.get && req.app.get("io");
      if (io) {
        io.emit("ad:closed", { id: ad._id.toString() });
        // Notify all bidders with suggestions trigger
        const bidders = Array.from(new Set((ad.bids || []).map((b) => b.user).filter(Boolean)));
        for (const u of bidders) {
          io.to(`userName:${u}`).emit("notify:adClosed", {
            adId: ad._id.toString(),
            title: ad.title,
            brand: ad.brand,
            subcategory: ad.subcategory,
          });
        }
      }
    } catch {}
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to close auction" });
  }
};

// Get ads posted by this user (seller)
exports.getAdsByUser = async (req, res) => {
  try {
    const ads = await Ad.find({ createdBy: req.params.username });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user ads" });
  }
};

// Delete an ad
exports.deleteAd = async (req, res) => {
  try {
    const removed = await Ad.findByIdAndDelete(req.params.id);
    try {
      const io = req.app && req.app.get && req.app.get("io");
      if (io && removed) io.emit("ad:deleted", { id: removed._id.toString() });
    } catch {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete ad" });
  }
};
