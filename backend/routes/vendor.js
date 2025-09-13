const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { authRequired, requireApprovedVendor } = require("../middleware/auth");

// Get all bookings for the logged-in vendor
router.get("/bookings", authRequired, async (req, res) => {
  try {
    const vendorId = req.user.id || req.user._id;
    const bookings = await Booking.find({ shopId: vendorId })
      .populate("userId", "name email")
      .populate("shopId", "name email");

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching vendor bookings:", err);
    res.status(500).json({ message: "Could not fetch vendor bookings" });
  }
});

module.exports = router;
