const express = require("express");
const router = express.Router();
const personalization = require("../controllers/personalizationController");

router.post("/save", personalization.saveComparison);
router.get("/list", personalization.savedComparisons);

module.exports = router;

