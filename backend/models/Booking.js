// backend/models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Customer
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Vendor (stored in User collection)
    issue: { type: String, required: true },
    date: { type: Date, required: true },
    allocatedTime: { type: String, default: null },
    status: { type: String, default: "Pending" },
    progress: {
      label: { type: String, default: "Pending" },
      percent: { type: Number, default: 0 },
      history: { type: Array, default: [] },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
