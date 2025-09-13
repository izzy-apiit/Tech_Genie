const mongoose = require("mongoose");

const AdChatMessageSchema = new mongoose.Schema(
  {
    adId: { type: String, required: true },
    productTitle: { type: String },
    sellerUsername: { type: String, required: true },
    buyerUsername: { type: String, required: true },
    from: { type: String, enum: ["seller", "buyer"], required: true },
    message: { type: String, required: true },
    ts: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdChatMessage", AdChatMessageSchema);
