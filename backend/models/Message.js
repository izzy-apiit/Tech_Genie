const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  bookingId: { type: String, required: true }, // tie messages to a booking
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, default: "" },
  imageUrl: { type: String, default: null },

  // optional legacy fields – safe to keep if you want them
  shopId: { type: String },
  serviceName: { type: String },

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
