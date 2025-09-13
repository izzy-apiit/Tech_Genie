const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({});

    const normalized = products.map((p) => ({
      _id: p._id,
      title: p.title || "Untitled Product",
      category: p.category || p.brand || "Uncategorized",
      price: p.price || 0,
      thumbnail: p.thumbnail || p.image_url || "/fallback.jpg", // fallback if no URL
      specs: p.specs || {},
      rating: p.rating || null,
      link: p.link || p.product_url || "#",
      brand: p.brand || "Unknown",
      created_at: p.created_at || new Date(),
    }));

    console.log("Normalized products:", normalized); // debug
    res.json(normalized);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;
