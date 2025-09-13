// backend/routes/bookings.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const User = require("../models/User");
const { authRequired, requireApprovedVendor } = require("../middleware/auth");
const { sendProgressEmail, sendProgressSMS } = require("../utils/notifications");

// =====================
// Create a new booking
// =====================
router.post("/", async (req, res) => {
  try {
    const { userId, shopId, issue, date, allocatedTime } = req.body;

    if (!userId || !shopId || !issue || !date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // make sure vendor exists
    const vendor = await User.findOne({
      _id: shopId,
      role: "vendor",
      isVendorApproved: true,
    });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Optional: prevent double booking for the same shop/date/slot
    if (allocatedTime) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const existing = await Booking.findOne({
        shopId,
        date: { $gte: dayStart, $lt: dayEnd },
        allocatedTime,
        status: { $ne: "Cancelled" },
      });
      if (existing) {
        return res.status(409).json({ error: "Time slot already booked" });
      }
    }

    const booking = new Booking({
      userId,
      shopId,
      issue,
      date,
      allocatedTime: allocatedTime || null,
      status: "Pending",
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Could not create booking" });
  }
});

// =====================
// Get all bookings for vendor (auth required)
// =====================
router.get("/vendor/bookings", authRequired, async (req, res) => {
  try {
    const bookings = await Booking.find({ shopId: req.user.sub })
      .populate("userId", "name email")
      .populate("shopId", "name email");

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching vendor bookings:", err);
    res.status(500).json({ message: "Could not fetch vendor bookings" });
  }
});

// =====================
// Get all bookings for a specific user
// =====================
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).populate(
      "shopId",
      "name email",
    );

    const formatted = bookings.map((b) => ({
      _id: b._id,
      vendorId: b.shopId._id,
      vendorName: b.shopId.name,
      status: b.status,
      date: b.date,
      allocatedTime: b.allocatedTime || null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: "Could not fetch user bookings" });
  }
});

// =====================
// Update booking status
// =====================
router.put(
  "/vendor/bookings/:id/status",
  authRequired,
  requireApprovedVendor,
  async (req, res) => {
    try {
      const { status, progress } = req.body;

      const booking = await Booking.findOne({
        _id: req.params.id,
        shopId: req.user.sub,
      });

      if (!booking) return res.status(404).json({ error: "Booking not found" });

      if (status) booking.status = status;
      if (progress) booking.progress = progress;

      await booking.save();

      // Notify customer via email/SMS on progress or status change
      try {
        if (booking.userId) {
          // Send on any progress update or status change
          await Promise.all([
            sendProgressEmail(booking.userId, booking).catch(() => {}),
            sendProgressSMS(booking.userId, booking).catch(() => {}),
          ]);
        }
      } catch {}

      res.json(booking);
    } catch (err) {
      console.error("Error updating booking status:", err);
      res.status(500).json({ error: "Could not update booking status" });
    }
  },
);

// =====================
// Allocate time for booking
// =====================
router.put(
  "/vendor/bookings/:id/allocate",
  authRequired,
  requireApprovedVendor,
  async (req, res) => {
    try {
      const { allocatedTime } = req.body;

      const booking = await Booking.findOne({
        _id: req.params.id,
        shopId: req.user.sub,
      });

      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (!allocatedTime)
        return res.status(400).json({ error: "Allocated time required" });

      // New rule: vendors cannot change the customer's requested time once set
      if (booking.allocatedTime && booking.allocatedTime !== allocatedTime) {
        return res
          .status(403)
          .json({ error: "Allocated time is fixed by the customer" });
      }

      booking.allocatedTime = allocatedTime; // allow setting only if it was empty
      await booking.save();

      res.json(booking);
    } catch (err) {
      console.error("Error allocating time:", err);
      res.status(500).json({ error: "Could not allocate time" });
    }
  },
);

// =====================
// Availability for next N days (default 7) between 09:00–12:00 in 30‑minute slots
// GET /api/bookings/availability?shopId=...&days=7&start=YYYY-MM-DD&userId=...
// =====================
router.get("/availability", async (req, res) => {
  try {
    const { shopId } = req.query;
    const days = Math.max(1, Math.min(14, Number(req.query.days) || 7));
    const userId = req.query.userId || null;
    if (!shopId) return res.status(400).json({ error: "shopId is required" });

    const startDate = req.query.start
      ? new Date(req.query.start)
      : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Load existing bookings in the range
    const booked = await Booking.find({
      shopId,
      date: { $gte: startDate, $lt: endDate },
      status: { $ne: "Cancelled" },
    }).lean();

    // Index by dateKey+slot for quick lookup
    const taken = new Map();
    for (const b of booked) {
      const d = new Date(b.date);
      d.setHours(0, 0, 0, 0);
      const key = `${d.toISOString().slice(0, 10)}|${b.allocatedTime}`;
      taken.set(key, b);
    }

    // Build slots per day
    const makeSlots = (dateKey) => {
      const slots = [];
      const base = new Date(`${dateKey}T09:00:00.000Z`);
      // We'll render 6 slots 09:00-12:00 in 30‑minute increments
      for (let i = 0; i < 6; i++) {
        const from = new Date(base.getTime() + i * 30 * 60000);
        const to = new Date(from.getTime() + 30 * 60000);
        const fmt = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" });
        const label = `${fmt(from)}-${fmt(to)}`;
        const b = taken.get(`${dateKey}|${label}`);
        slots.push({
          label,
          available: !b,
          bookedByMe: userId && b && String(b.userId) === String(userId),
        });
      }
      return slots;
    };

    const daysOut = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      daysOut.push({ date: dateKey, slots: makeSlots(dateKey) });
    }

    res.json({ shopId, days: daysOut });
  } catch (err) {
    console.error("Error building availability:", err);
    res.status(500).json({ error: "Could not fetch availability" });
  }
});

module.exports = router;
