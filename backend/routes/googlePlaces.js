const express = require("express");
const axios = require("axios");
const router = express.Router();

// GET /api/google-places/nearby?lat=xx&lng=yy
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    // Request nearby repair shops from Google Places API
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000, // 5km radius
          keyword: "electronics repair", // Search text
          type: "electronics_store", // Places API category for electronics shops
          key: apiKey,
        },
      },
    );

    // Return only the results array (or you can customize further)
    console.log("Google Places API raw response:", response.data);
    res.json({ results: response.data.results });
  } catch (error) {
    console.error("Error fetching nearby repair shops:", error.message);
    res.status(500).json({ error: "Failed to fetch nearby shops" });
  }
});

module.exports = router;
