const upload = require("../middleware/upload");
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { authRequired } = require("../middleware/auth");

// POST a new message
router.post("/", authRequired, upload.single("image"), async (req, res) => {
  try {
    const { bookingId, senderId, receiverId, message } = req.body;

    if (!bookingId || !senderId || !receiverId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (req.user.sub !== senderId) {
      return res.status(403).json({ error: "Cannot send as another user" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // static folder served in index.js
    }

    const newMessage = new Message({
      bookingId,
      senderId,
      receiverId,
      message: message || "",
      imageUrl,
    });
    const saved = await newMessage.save();

    const io = req.app.get("io");
    io.to(`user:${receiverId}`).emit("message:new", saved);
    io.to(`user:${senderId}`).emit("message:new", saved);

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// GET: all messages between two users (only participants can read)
// GET messages for a booking
router.get("/:bookingId", authRequired, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await Message.find({ bookingId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

module.exports = router;
