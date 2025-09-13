// utils/convertCurrency.js
const axios = require("axios");

async function getUSDtoLKRRate() {
  try {
    const response = await axios.get(
      "https://currency-conversion-and-exchange-rates.p.rapidapi.com/convert",
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.CURRENCY_EXCHANGE_API_HOST,
        },
        params: {
          from: "USD",
          to: "LKR",
          amount: 1,
        },
      },
    );

    return response.data.result;
  } catch (err) {
    console.error("Error fetching USD to LKR rate:", err.message);
    return null;
  }
}

module.exports = { getUSDtoLKRRate };
