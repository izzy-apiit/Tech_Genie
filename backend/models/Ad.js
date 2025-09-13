// 📁 backend/models/Ad.js
const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  user: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const adSchema = new mongoose.Schema(
  {
    deviceType: { type: String, required: true },
    subcategory: { type: String },
    brand: { type: String, required: true },
    title: { type: String, required: true },
    condition: { type: String, required: true },
    mobile: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    createdBy: { type: String, required: true },
    endTime: { type: Date, required: true },
    images: [{ type: String }],
    bids: [bidSchema],
    isClosed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// ✅ Prevent OverwriteModelError in hot reloads
module.exports = mongoose.models.Ad || mongoose.model("Ad", adSchema);
