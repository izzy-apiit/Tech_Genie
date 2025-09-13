const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authRequired, requireRole } = require("../middleware/auth.js");

// Only admin can access
router.use(authRequired);
router.use(requireRole("admin"));

// GET: all pending vendors
router.get("/pending-vendors", async (req, res) => {
  try {
    const pendingVendors = await User.find({
      role: "vendor",
      isVendorApproved: false,
    });
    res.json(pendingVendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending vendors" });
  }
});

// PUT: approve vendor
router.put("/approve-vendor/:id", async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    vendor.isVendorApproved = true;
    await vendor.save();

    res.json({ message: "Vendor approved", vendor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve vendor" });
  }
});

// PUT: reject vendor
router.put("/reject-vendor/:id", async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    await vendor.remove();
    res.json({ message: "Vendor rejected and removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject vendor" });
  }
});

module.exports = router;
