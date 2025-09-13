const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: String,
  brand: String,
  price: Number,
  currency: String,
  thumbnail: String, // keep for legacy products
  image_url: String, // match DB
  specs: Object,
  rating: Number,
  link: String, // keep for legacy products
  product_url: String, // match DB
  source: String,
  source_product_id: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema, "products");
