const User = require("../models/User");
const Ad = require("../models/Ad");

function pushCapped(arr, value, max = 10) {
  const out = [value, ...arr.filter((v) => JSON.stringify(v) !== JSON.stringify(value))];
  return out.slice(0, max);
}

exports.dashboard = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "username required" });
    const user = await User.findOne({ name: username }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const bidAdIds = (user.recentBids || []).map((b) => b.adId).filter(Boolean);
    const ads = bidAdIds.length ? await Ad.find({ _id: { $in: bidAdIds } }).lean() : [];
    const adById = Object.fromEntries(ads.map((a) => [a._id.toString(), a]));

    const recentBids = (user.recentBids || []).map((b) => ({
      ...b,
      ad: adById[b.adId?.toString()] || null,
    }));

    res.json({
      welcomeName: user.name,
      persona: user.persona,
      preferences: user.preferences || {},
      recentSearches: user.recentSearches?.slice(0, 8) || [],
      savedComparisons: user.savedComparisons?.slice(0, 5) || [],
      recentBids: recentBids.slice(0, 8),
      lastActivity: user.lastActivity || { type: "none", data: {}, ts: null },
    });
  } catch (e) {
    console.error("[personalization.dashboard]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { username, preferences, persona } = req.body || {};
    if (!username) return res.status(400).json({ error: "username required" });
    const update = {};
    if (preferences) update["preferences"] = preferences;
    if (persona) update["persona"] = persona;
    const user = await User.findOneAndUpdate({ name: username }, update, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (e) {
    console.error("[personalization.updatePreferences]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.recordSearch = async (req, res) => {
  try {
    const { username, query } = req.body || {};
    if (!username || !query)
      return res.status(400).json({ error: "username and query required" });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });
    user.recentSearches = pushCapped(user.recentSearches || [], query, 12);
    user.lastActivity = { type: "search", data: { query }, ts: new Date() };
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error("[personalization.recordSearch]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.deleteRecentSearch = async (req, res) => {
  try {
    const { username, index, query } = req.body || {};
    if (!username)
      return res.status(400).json({ error: "username required" });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const searches = Array.isArray(user.recentSearches) ? [...user.recentSearches] : [];
    if (typeof index === "number" && index >= 0 && index < searches.length) {
      searches.splice(index, 1);
    } else if (typeof query === "string" && query.trim()) {
      const idx = searches.findIndex((s) => s === query);
      if (idx !== -1) searches.splice(idx, 1);
    }

    user.recentSearches = searches;
    await user.save();
    res.json({ success: true, recentSearches: searches.slice(0, 8) });
  } catch (e) {
    console.error("[personalization.deleteRecentSearch]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.recordBid = async (req, res) => {
  try {
    const { username, adId, amount } = req.body || {};
    if (!username || !adId)
      return res.status(400).json({ error: "username and adId required" });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });
    const ad = await Ad.findById(adId).lean();
    user.recentBids = pushCapped(
      user.recentBids || [],
      {
        adId,
        amount: Number(amount) || null,
        title: ad?.title || "",
        brand: ad?.brand || "",
        subcategory: ad?.subcategory || "",
        ts: new Date(),
      },
      20,
    );
    user.lastActivity = { type: "bid", data: { adId, amount }, ts: new Date() };
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error("[personalization.recordBid]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.saveComparison = async (req, res) => {
  try {
    const { username, title, items } = req.body || {};
    if (!username || !Array.isArray(items) || items.length < 2)
      return res.status(400).json({ error: "username and 2 items required" });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });
    const entry = { title: title || `Comparison ${new Date().toLocaleDateString()}`, items: items.slice(0, 2), ts: new Date() };
    user.savedComparisons = [entry, ...(user.savedComparisons || [])].slice(0, 20);
    user.lastActivity = { type: "compare", data: { title: entry.title }, ts: new Date() };
    await user.save();
    res.status(201).json({ success: true });
  } catch (e) {
    console.error("[personalization.saveComparison]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.deleteSavedComparison = async (req, res) => {
  try {
    const { username, timestamp, index } = req.body || {};
    if (!username)
      return res.status(400).json({ error: "username required" });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const saved = Array.isArray(user.savedComparisons) ? [...user.savedComparisons] : [];
    let removed = false;
    if (typeof index === "number" && index >= 0 && index < saved.length) {
      saved.splice(index, 1);
      removed = true;
    } else if (timestamp) {
      const tsString = String(timestamp);
      const idx = saved.findIndex((entry) => String(entry.ts) === tsString);
      if (idx !== -1) {
        saved.splice(idx, 1);
        removed = true;
      }
    }

    if (!removed) return res.status(200).json({ success: true, savedComparisons: saved.slice(0, 5) });

    user.savedComparisons = saved;
    await user.save();
    res.json({ success: true, savedComparisons: saved.slice(0, 5) });
  } catch (e) {
    console.error("[personalization.deleteSavedComparison]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.savedComparisons = async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ name: username }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ items: user.savedComparisons || [] });
  } catch (e) {
    console.error("[personalization.savedComparisons]", e);
    res.status(500).json({ error: "server error" });
  }
};

exports.recommendations = async (req, res) => {
  try {
    const { username, device } = req.query;
    const user = username ? await User.findOne({ name: username }).lean() : null;
    let keywords = [];
    if (user?.recentSearches?.length) keywords.push(...user.recentSearches.slice(0, 5));
    if (user?.recentBids?.length) {
      keywords.push(
        ...user.recentBids
          .slice(0, 5)
          .map((b) => [b.title, b.brand, b.subcategory].filter(Boolean).join(" ")),
      );
    }
    // include persona+device tags
    if (Array.isArray(user?.preferences?.personaTags)) keywords.push(...user.preferences.personaTags);
    if (Array.isArray(user?.preferences?.deviceTags)) keywords.push(...user.preferences.deviceTags);
    keywords = keywords.join(" ").toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);

    const persona = user?.persona || "General";
    const prefDevice = user?.preferences?.devicePreference || "auto";
    const effectiveDevice = device || (prefDevice !== "auto" ? prefDevice : "desktop");

    // Optional price filter from saved budgetRange
    let priceMin = 0, priceMax = Infinity;
    const br = user?.preferences?.budgetRange || "";
    const nums = String(br).match(/\d+/g)?.map((n) => Number(n)) || [];
    if (nums.length >= 2) { priceMin = nums[0]; priceMax = nums[1]; }

    const ads = await Ad.find({ isClosed: false }).limit(200).lean();
    const score = (ad) => {
      let s = 0;
      const text = `${ad.title || ""} ${ad.brand || ""} ${ad.subcategory || ""} ${ad.deviceType || ""}`.toLowerCase();
      for (const k of keywords) if (k && text.includes(k)) s += 3;
      if (persona === "Gamer" && /gpu|graphics|gaming|ryzen|rtx|gtx|laptop/i.test(text)) s += 2;
      if (persona === "Creator" && /mac|pro|ssd|monitor|camera/i.test(text)) s += 2;
      if (persona === "Student" && /laptop|tablet|budget|used/i.test(text)) s += 2;
      if (effectiveDevice === "mobile" && /phone|tablet/i.test(text)) s += 1;
      if (effectiveDevice === "desktop" && /pc|desktop|monitor|keyboard|gpu/i.test(text)) s += 1;
      const age = Date.now() - new Date(ad.createdAt || ad._id.getTimestamp?.() || Date.now());
      if (age < 1000 * 60 * 60 * 24 * 2) s += 1;
      return s;
    };
    const filtered = ads.filter((a) => typeof a.price === 'number' ? (a.price >= priceMin && a.price <= priceMax) : true);
    const ranked = filtered.map((a) => ({ a, s: score(a) })).sort((x, y) => y.s - x.s).slice(0, 16).map((x) => x.a);
    res.json({ items: ranked });
  } catch (e) {
    console.error("[personalization.recommendations]", e);
    res.status(500).json({ error: "server error" });
  }
};
