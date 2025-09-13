const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Function to generate JWT token
const signToken = (user) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    isVendorApproved: user.isVendorApproved,
    name: user.name,
  };
  const secret = process.env.JWT_ACCESS_SECRET || "dev_secret";
  const expiresIn = process.env.JWT_ACCESS_TTL || "7d";
  return jwt.sign(payload, secret, { expiresIn });
};

// Register (frontend)
router.post("/register", async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    // Basic phone normalization (optional field)
    let phoneNorm = undefined;
    if (phone && typeof phone === "string") {
      const p = phone.trim();
      // Accept E.164-like or local; store as-is if reasonable length
      if (/^[+\d][\d\s()-]{6,20}$/.test(p)) phoneNorm = p.replace(/\s+/g, " ");
    }

    const user = await User.create({
      name,
      email,
      password_hash, // fixed
      role: ["customer", "vendor"].includes(role) ? role : "customer",
      isVendorApproved: role === "vendor" ? false : undefined,
      phone: phoneNorm,
    });

    return res.json({ message: "Registration successful", userId: user._id });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const hashedPassword = user.password_hash; // fixed
    const ok = await bcrypt.compare(password, hashedPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    return res.json({
      message: "Login successful",
      name: user.name,
      userId: user._id,
      role: user.role,
      isVendorApproved: user.isVendorApproved,
      token,
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
