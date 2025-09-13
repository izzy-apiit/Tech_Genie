const express = require("express");
const router = express.Router();
const RepairShop = require("../models/RepairShop");

// GET all repair shops
router.get("/", async (req, res) => {
  try {
    const shops = await RepairShop.find();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new shop (optional, useful for admin/seeding)
router.post("/", async (req, res) => {
  const shop = new RepairShop(req.body);
  try {
    const saved = await shop.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
