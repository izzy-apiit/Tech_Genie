const mongoose = require("mongoose");

const RepairShopSchema = new mongoose.Schema({
  name: String,
  address: String,
  contactNumber: String,
  email: String,
  location: {
    type: {
      type: String, // GeoJSON type must be "Point"
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
});

// Create 2dsphere index on location for geospatial queries
RepairShopSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("RepairShop", RepairShopSchema);
