const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password_hash: { type: String, required: true }, // always store hashed password here
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    isVendorApproved: { type: Boolean, default: false },
    // --- Personalization fields (MVP) ---
    preferences: {
      devicePreference: { type: String, enum: ["mobile", "desktop", "auto"], default: "auto" },
      budgetRange: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    persona: { type: String, enum: ["General", "Gamer", "Creator", "Student", "Pro"], default: "General" },
    recentSearches: [{ type: String }],
    recentBids: [
      {
        adId: { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },
        amount: Number,
        ts: { type: Date, default: Date.now },
        title: String,
        brand: String,
        subcategory: String,
      },
    ],
    savedComparisons: [
      {
        title: String,
        // store either product ids/titles or freeform AI items
        items: [mongoose.Schema.Types.Mixed],
        ts: { type: Date, default: Date.now },
      },
    ],
    lastActivity: {
      type: {
        type: String,
        enum: ["search", "view", "bid", "chat", "compare", "none"],
        default: "none",
      },
      data: { type: Object, default: {} },
      ts: { type: Date },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
