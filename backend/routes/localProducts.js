const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { fetchAll } = require("../scrapers");

// POST /api/local-products/sync -> scrape a handful of Sri Lankan stores
router.post("/sync", async (_req, res) => {
  try {
    const items = await fetchAll();
    let upserts = 0;
    for (const it of items) {
      const filter = {
        $or: [
          { source: it.source, source_product_id: it.source_product_id },
          { link: it.link },
        ],
      };
      await Product.findOneAndUpdate(
        filter,
        {
          $set: {
            title: it.title,
            brand: it.brand,
            category: it.category || "",
            price: it.price || null,
            currency: it.currency || "LKR",
            thumbnail: it.thumbnail || "",
            image_url: it.thumbnail || "",
            link: it.link,
            product_url: it.link,
            source: it.source,
            source_product_id: it.source_product_id,
          },
        },
        { upsert: true, new: true },
      );
      upserts++;
    }
    res.json({ success: true, count: upserts });
  } catch (e) {
    console.error("[local-products/sync]", e);
    res.status(500).json({ success: false, error: "Sync failed" });
  }
});

// GET /api/local-products/search?q=...&limit=12
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(24, Number(req.query.limit) || 12);
    const cond = q
      ? { title: { $regex: q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), $options: "i" } }
      : {};
    const docs = await Product.find(cond).sort({ created_at: -1 }).limit(limit);
    const out = docs.map((p) => ({
      title: p.title,
      priceLKR: p.currency === "LKR" ? p.price : null,
      priceUSD: p.currency === "USD" ? p.price : null,
      priceFormatted:
        p.price != null
          ? (p.currency === "LKR" ? `LKR ${Number(p.price).toLocaleString()}` : `$${Number(p.price).toLocaleString()}`)
          : "N/A",
      link: p.product_url || p.link || "#",
      thumbnail: p.thumbnail || p.image_url || "",
      rating: p.rating || null,
      source: p.source || "local",
    }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;

