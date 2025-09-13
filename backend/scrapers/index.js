const { scrapeWooCategory } = require("./woocommerce");

// Define a small set of Sri Lankan stores (WooCommerce based)
const stores = [
  {
    name: "techzone.lk",
    base: "https://techzone.lk/",
    categories: ["product-category/laptops/"],
    brand: "TechZone",
  },
  {
    name: "laptop.lk",
    base: "https://www.laptop.lk/",
    categories: ["product-category/laptops/"],
    brand: "Laptop.lk",
  },
  {
    name: "lap.lk",
    base: "https://lap.lk/",
    categories: ["product-category/laptop/"],
    brand: "Lap.lk",
  },
];

async function fetchAll() {
  const results = [];
  for (const s of stores) {
    for (const c of s.categories) {
      const items = await scrapeWooCategory({ base: s.base, categoryUrl: c, brand: s.brand });
      results.push(...items);
    }
  }
  return results;
}

module.exports = { fetchAll };

