const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authRequired, requireRole } = require("../middleware/auth");

router.use(authRequired);
router.use(requireRole("admin"));

// GET all users (vendors + customers)
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT update user details
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// PUT change role
router.put("/:id/role", async (req, res) => {
  try {
    const { role } = req.body; // admin, vendor, customer
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.role = role;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to change role" });
  }
});

module.exports = router;
