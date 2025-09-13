const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");

// GET current highest bid for a product
router.get("/:productId", bidController.getBidsByProduct);

// POST a new bid
router.post("/:productId", bidController.placeBid);

module.exports = router;
