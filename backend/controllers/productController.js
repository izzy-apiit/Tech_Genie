const axios = require("axios");
const { getUSDtoLKRRate } = require("../utils/convertCurrency");

// Helper to pick the products array from different API response shapes
function pickProductsArray(apiData) {
  if (!apiData) return [];
  if (Array.isArray(apiData.products)) return apiData.products;
  if (Array.isArray(apiData.product_results)) return apiData.product_results;
  if (apiData.data) {
    if (Array.isArray(apiData.data.products)) return apiData.data.products;
    if (Array.isArray(apiData.data.product_results))
      return apiData.data.product_results;
  }
  return [];
}

// Helper to format numbers with commas
function formatNumberWithCommas(x) {
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

async function searchProductsOnRapidAPI({
  category,
  features,
  priceRangeLKR,
  useCase,
}) {
  // Build search query
  const queryParts = [];
  if (category) queryParts.push(String(category));
  if (features && Array.isArray(features))
    queryParts.push(...features.map(String));
  else if (features) queryParts.push(String(features));
  if (useCase) queryParts.push(String(useCase));
  const query = queryParts.join(" ").trim();

  console.log("[ProductFinder] RapidAPI search query =>", query || "(empty)");

  const options = {
    method: "GET",
    url: "https://real-time-product-search.p.rapidapi.com/search",
    params: { q: query || "electronics", country: "US", language: "en" },
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host":
        process.env.RAPIDAPI_HOST || "real-time-product-search.p.rapidapi.com",
    },
    timeout: 15000,
  };

  try {
    // Helper: map Google Shopping product_attributes to our unified specs
    const attributesToSpecs = (attrs = {}) => {
      if (!attrs || typeof attrs !== "object") return {};
      // Normalize keys to lower for easier matching
      const entries = Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v]);
      const get = (...names) => {
        const idx = entries.findIndex(([k]) => names.some((n) => k.includes(n.toLowerCase())));
        return idx >= 0 ? entries[idx][1] : undefined;
      };

      const specs = {
        // Brand may appear in attributes in some feeds
        brand: get("brand"),
        cpu: get("cpu", "processor", "proc brand"),
        gpu: get("gpu", "graphics"),
        ram: get("installed memory", "ram", "memory"),
        storage: get("storage capacity", "drive capacity", "storage type"),
        displaySize: get("disp size", "display size", "screen size"),
        displayResolution: get("disp resolution", "resolution"),
        refreshRate: get("refresh", "disp refresh"),
        brightness: get("brightness"),
        battery: get("battery capacity", "battery"),
        charging: get("ac adapter output", "charging"),
        ports: get("ports"),
        os: get("os version", "supp os", "win ver", "operating system"),
        build: get("material", "design highlights"),
        weight: get("weight"),
        camera: get("front cam", "video res", "cam"),
        speakers: get("audio features", "speaker"),
        wifi: get("wireless lan", "wi-fi", "wifi"),
        bluetooth: get("bluetooth"),
        fingerprint: get("fingerprint"),
        ip: get("ip rating"),
      };

      // Light cleanup for a few fields
      if (typeof specs.displaySize === "string")
        specs.displaySize = specs.displaySize
          .replace(/\s*(inches?|in\.?)/i, "")
          .replace(/\"/g, "")
          .trim();
      if (typeof specs.refreshRate === "string" && !/hz/i.test(specs.refreshRate))
        specs.refreshRate = `${specs.refreshRate} Hz`;
      return Object.fromEntries(
        Object.entries(specs).filter(([, v]) => v != null && String(v).trim() !== ""),
      );
    };
    // Get USD → LKR rate
    let usdToLkrRate = null;
    try {
      usdToLkrRate = await getUSDtoLKRRate();
      console.log("[ProductFinder] USD→LKR rate:", usdToLkrRate);
    } catch (rateErr) {
      console.warn(
        "[ProductFinder] USD→LKR fetch failed (will skip price filter):",
        rateErr?.message,
      );
    }

    const response = await axios.request(options);
    console.log(
      "[ProductFinder] RapidAPI keys:",
      Object.keys(response.data || {}),
    );
    console.log(
      "[ProductFinder] Full API response:",
      JSON.stringify(response.data, null, 2),
    );

    const rawProducts = pickProductsArray(response.data);
    if (!Array.isArray(rawProducts)) {
      console.error(
        "[ProductFinder] Unexpected API shape:",
        JSON.stringify(response.data)?.slice(0, 400),
      );
      return [];
    }

    // Normalized mapping with robust price extraction
    const normalized = rawProducts.map((item) => {
      let priceText = "";

      // Price extraction priority
      if (item.offer && item.offer.price) priceText = item.offer.price;
      else if (
        Array.isArray(item.typical_price_range) &&
        item.typical_price_range.length
      )
        priceText =
          item.typical_price_range[item.typical_price_range.length - 1]; // pick max
      else if (item.product_price) priceText = item.product_price;
      else if (item.price) priceText = item.price;
      else if (item.offer_price) priceText = item.offer_price;

      // Extract numeric USD
      let priceUSD = null;
      if (typeof priceText === "string") {
        const match = priceText.match(/[\d,.]+/);
        if (match) priceUSD = parseFloat(match[0].replace(/,/g, ""));
      } else if (typeof priceText === "number") {
        priceUSD = priceText;
      }

      // Sanity check
      if (priceUSD != null && priceUSD < 10) priceUSD = null;

      // Convert to LKR
      let priceLKR = null;
      if (priceUSD != null && usdToLkrRate) {
        priceLKR = priceUSD * usdToLkrRate;
      }

      const priceFormatted =
        priceLKR != null
          ? `රු ${formatNumberWithCommas(priceLKR.toFixed(2))}`
          : priceUSD != null
            ? `$${formatNumberWithCommas(priceUSD.toFixed(2))}`
            : "N/A";

      // Image selection
      const imageUrl =
        item.product_photo ||
        item.imageUrl ||
        (Array.isArray(item.product_photos) && item.product_photos[0]) ||
        (Array.isArray(item.images) && item.images[0]?.url) ||
        item.thumbnail ||
        "";

      // Extract specs when available (Google Shopping attributes)
      const specs = attributesToSpecs(item.product_attributes || item.attributes || {});

      // Extract domain/vendor from link if present
      let domain = null;
      try {
        const u = new URL(item.product_url || item.url || "", "http://dummy");
        domain = (u.hostname || "").replace(/^www\./i, "");
      } catch {}

      return {
        title: item.product_title || item.title || "No title",
        priceUSD: priceUSD ?? null,
        priceLKR: priceLKR,
        // For frontend convenience, expose a generic numeric price in LKR if available
        price: typeof priceLKR === "number" ? priceLKR : null,
        priceFormatted,
        link: item.product_url || item.url || "#",
        thumbnail: imageUrl,
        rating: item.product_rating || item.rating || null,
        source: item.source || item.merchant || domain || "Unknown",
        domain,
        specs,
        product_id: item.product_id || item.asin || undefined,
      };
    });

    // Apply price filtering if LKR range exists
    let output = normalized;
    if (priceRangeLKR && typeof priceRangeLKR === "object" && usdToLkrRate) {
      const { min = 0, max = Infinity } = priceRangeLKR;
      output = normalized.filter(
        (p) =>
          typeof p.priceLKR === "number" &&
          p.priceLKR >= min &&
          p.priceLKR <= max,
      );
    } else if (priceRangeLKR && !usdToLkrRate) {
      console.warn(
        "[ProductFinder] Skipping price filter because currency rate is unavailable.",
      );
    }

    console.log(
      `[ProductFinder] Returning ${output.length}/${normalized.length} products`,
    );
    return output;
  } catch (error) {
    if (error.response) {
      console.error(
        "[ProductFinder] RapidAPI error:",
        error.response.status,
        JSON.stringify(error.response.data)?.slice(0, 400),
      );
    } else {
      console.error("[ProductFinder] RapidAPI error:", error.message);
    }
    return [];
  }
}

// Chatbot catalog (local retailers)
const chatbotCatalog = require("../data/chatbotProductsSeed");
const Product = require("../models/Product");

let catalogSeeded = false;

async function ensureCatalogSeeded() {
  if (catalogSeeded) return;
  const existing = await Product.countDocuments({ source: "chatbot-seed" });
  if (existing < chatbotCatalog.length) {
    await Promise.all(
      chatbotCatalog.map((item) =>
        Product.updateOne(
          { source_product_id: item.source_product_id },
          {
            $set: {
              ...item,
              created_at: item.created_at || new Date(),
            },
          },
          { upsert: true },
        ),
      ),
    );
  }
  catalogSeeded = true;
}

async function searchLocalProducts({ category, features, priceRangeLKR, useCase }, limit = 12) {
  await ensureCatalogSeeded();
  const parts = [];
  if (category) parts.push(String(category));
  if (useCase) parts.push(String(useCase));
  if (Array.isArray(features)) parts.push(...features.map(String));
  const q = parts.join(" ").trim();

  const cond = { source: "chatbot-seed" };
  if (q) {
    const sanitized = q.replace(/[\s]+/g, " ").trim();
    const tokens = sanitized.split(" ").map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const regexes = tokens.map((t) => new RegExp(t, "i"));
    cond.$and = regexes.map((rgx) => ({
      $or: [{ title: rgx }, { brand: rgx }, { category: rgx }],
    }));
  }
  // Optional price filtering (only LKR data for local stores)
  if (priceRangeLKR && typeof priceRangeLKR === "object") {
    cond.currency = "LKR";
    const { min = 0, max = Infinity } = priceRangeLKR;
    cond.price = { $gte: min, $lte: max };
  }

  const docs = await Product.find(cond).sort({ created_at: -1 }).limit(limit);
  return docs.map((p) => ({
    title: p.title,
    priceUSD: p.currency === "USD" ? p.price : null,
    priceLKR: p.currency === "LKR" ? p.price : null,
    priceFormatted:
      p.price != null
        ? (p.currency === "LKR" ? `LKR ${Number(p.price).toLocaleString()}` : `$${Number(p.price).toLocaleString()}`)
        : "N/A",
    link: p.product_url || p.link || "#",
    thumbnail: p.thumbnail || p.image_url || "",
    rating: p.rating || null,
    source: p.source || "local",
    price: p.currency === "LKR" ? p.price : null,
    category: p.category || null,
    brand: p.brand || null,
    id: p._id?.toString?.() || p.source_product_id || p.title,
    summary: p.summary || null,
    description: p.description || null,
    pros: Array.isArray(p.pros) ? p.pros : [],
    cons: Array.isArray(p.cons) ? p.cons : [],
    vendor: p.vendor || null,
    availability: p.availability || null,
    specs: p.specs || {},
  }));
}

module.exports = { searchProductsOnRapidAPI, searchLocalProducts };
