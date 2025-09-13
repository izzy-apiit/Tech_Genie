const axios = require("axios");
const cheerio = require("cheerio");

function abs(base, href = "") {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function parseLKR(text = "") {
  const m = String(text).replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? Number(m[1]) : null;
}

async function scrapeWooCategory({ base, categoryUrl, brand = "" }) {
  const url = abs(base, categoryUrl);
  const out = [];
  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000,
    });
    const $ = cheerio.load(html);

    $("li.product").each((_, el) => {
      const $el = $(el);
      const title =
        $el.find(".woocommerce-loop-product__title").text().trim() ||
        $el.find("h2, h3").first().text().trim();
      const link = abs(base, $el.find("a.woocommerce-LoopProduct-link, a.woocommerce-loop-product__link, a").attr("href"));
      const img = $el.find("img").attr("data-src") || $el.find("img").attr("src") || "";
      const priceText =
        $el.find(".price .woocommerce-Price-amount").last().text().trim() ||
        $el.find(".woocommerce-Price-amount").last().text().trim() ||
        $el.find(".price").text().trim();
      const price = parseLKR(priceText);

      if (!title || !link) return;

      out.push({
        title,
        link,
        thumbnail: img,
        price,
        currency: "LKR",
        brand: brand || new URL(base).hostname.replace(/^www\./, ""),
        category: "Laptops",
        source: new URL(base).hostname.replace(/^www\./, ""),
        source_product_id: link,
      });
    });
  } catch (e) {
    console.warn(`[scrapeWooCategory] Failed for ${url}:`, e.message);
  }
  return out;
}

module.exports = { scrapeWooCategory };

