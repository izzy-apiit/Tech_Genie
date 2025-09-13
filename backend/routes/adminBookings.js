// backend/routes/adminBookings.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { authRequired, requireRole } = require("../middleware/auth");

router.use(authRequired);
router.use(requireRole("admin"));

// ✅ GET all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("shopId", "name email") // repair shop reference
      .populate("userId", "name email"); // customer reference

    const formatted = bookings.map((b) => ({
      _id: b._id,
      customerName: b.userId?.name || "Unknown",
      customerEmail: b.userId?.email || "Unknown",
      shopName: b.shopId?.name || "Unknown",
      shopEmail: b.shopId?.email || "Unknown",
      issue: b.issue,
      date: b.date,
      status: b.status,
      allocatedTime: b.allocatedTime,
      progress: b.progress,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch bookings error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch bookings", details: err.message });
  }
});

// ✅ DELETE booking
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking canceled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// PUT /api/admin/bookings/:id/status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    // Update only the status field
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    res.json({ message: "Booking status updated", booking });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res
      .status(500)
      .json({ error: "Failed to update booking status", details: err.message });
  }
});

module.exports = router;
