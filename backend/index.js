const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { searchProductsOnRapidAPI, searchLocalProducts } = require("./controllers/productController");

// Route Imports
const adsRoutes = require("./routes/ads.routes");
const repairShopRoutes = require("./routes/repairShops");
const bookingRoutes = require("./routes/bookings");
const usersRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");
const vendorRoutes = require("./routes/vendor");
const adminProductsRoutes = require("./routes/adminProducts");
const adminUsersRoutes = require("./routes/adminUsers");
const adminBookingsRoutes = require("./routes/adminBookings");
const adChatRoutes = require("./routes/adChat.routes");
const localProductsRoutes = require("./routes/localProducts");
const marketplaceRoutes = require("./routes/marketplace");
const manageAuctionRoutes = require("./routes/manageAuction");
const compareRoutes = require("./routes/compare");
const dashboardRoutes = require("./routes/dashboard");
const personalizationRoutes = require("./routes/personalization");
const bidRoutes = require("./routes/bid.routes");

// App and Server
const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || null;
  if (!token) return next();
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "dev_secret"
    );
    socket.user = payload;
    return next();
  } catch {
    return next();
  }
});

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
  if (socket.user?.sub) {
    socket.join(`user:${socket.user.sub}`);
  }
  if (socket.user?.name) {
    socket.join(`userName:${socket.user.name}`);
  }

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User ${socket.user.sub} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("adChat:message", (payload) => {
    try {
      const { adId, toUsername, productTitle, message, fromName } =
        payload || {};
      if (!adId || !toUsername || !message) return;
      const msg = {
        adId,
        productTitle: productTitle || "",
        message,
        fromName: fromName || socket.user?.name || "User",
        ts: Date.now(),
      };
      const rooms = [];
      if (toUsername) rooms.push(`userName:${toUsername}`);
      rooms.push(`ad:${adId}`);
      io.to(rooms).emit("adChat:message", msg);
    } catch {}
  });
});

app.set("io", io);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",               // dev
      "https://tech-genie-1.onrender.com"    // deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options(/.*/, cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Friendly root route
app.get("/", (req, res) => {
  res.send("✅ Tech Genie Backend is running!");
});

// Routes
app.use("/api/ads", adsRoutes);
app.use("/api/repair-shops", repairShopRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ad-chat", adChatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/google-places", require("./routes/googlePlaces"));
app.use("/api/products", productsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/bookings", adminBookingsRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/local-products", localProductsRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/manage-auction", manageAuctionRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/personalization", personalizationRoutes);

// MongoDB
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment (.env)");
  process.exit(1);
}

console.log("[MongoDB] Connecting to cluster...");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5050;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Gemini AI Product Finder
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post("/api/product-finder", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query)
      return res.status(400).json({ reply: "Please provide a query." });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Return ONLY compact JSON (no code fences) with keys:
      - category (string)
      - features (array of strings)
      - priceRange (string like "LKR 100000-200000", "< LKR 150000", "> LKR 250000", or just a number)
      - useCase (string)
      User query: "${query}"
    `;

    const result = await model.generateContent(prompt);
    let generatedText =
      (result?.response?.text && result.response.text()) || "";
    generatedText = generatedText.replace(/^```json\s*|\s*```$/g, "").trim();

    let productInfo;
    try {
      productInfo = JSON.parse(generatedText);
      if (typeof productInfo.features === "string")
        productInfo.features = [productInfo.features];
      if (!Array.isArray(productInfo.features)) productInfo.features = [];
    } catch (parseErr) {
      console.error("[ProductFinder] JSON parsing error. Raw:", generatedText);
      return res
        .status(500)
        .json({ reply: "Invalid response format from AI. Please try again." });
    }

    if (productInfo.priceRange) {
      const pr = String(productInfo.priceRange).trim();
      if (pr.includes("-")) {
        const [minStr, maxStr] = pr.split("-");
        productInfo.priceRangeLKR = {
          min: Number(minStr.replace(/[^\d]/g, "")) || 0,
          max: Number(maxStr.replace(/[^\d]/g, "")) || Infinity,
        };
      } else if (pr.startsWith("<")) {
        productInfo.priceRangeLKR = {
          min: 0,
          max: Number(pr.replace(/[^\d]/g, "")) || Infinity,
        };
      } else if (pr.startsWith(">")) {
        productInfo.priceRangeLKR = {
          min: Number(pr.replace(/[^\d]/g, "")) || 0,
          max: Infinity,
        };
      } else {
        productInfo.priceRangeLKR = {
          min: 0,
          max: Number(pr.replace(/[^\d]/g, "")) || Infinity,
        };
      }
    } else {
      productInfo.priceRangeLKR = null;
    }

    const pref = String(process.env.PRODUCT_FINDER_SOURCE || "external").toLowerCase();
    const local = pref !== "external" ? await searchLocalProducts(productInfo, 12) : [];
    let external = pref !== "local" ? await searchProductsOnRapidAPI(productInfo) : [];
    const priorityDomains = ["amazon.", "ebay.", "walmart.", "bestbuy."];
    const score = (p) => {
      const d = (p.domain || p.source || "").toLowerCase();
      const hit = priorityDomains.findIndex((pd) => d.includes(pd));
      return hit === -1 ? 100 : hit;
    };
    external = external.sort((a, b) => score(a) - score(b));
    const combined = pref === "external" ? external : [...external, ...local];
    const products = combined.slice(0, 16);
    return res.json({ reply: products });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ reply: "Failed to process your request." });
  }
});
