const Bid = require("../models/Bid");
const Ad = require("../models/Ad");

exports.getBidsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const bids = await Bid.find({ productId }).sort({ amount: -1 }).limit(1);
    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bid", error });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { productId } = req.params;
    const { bidderId, amount } = req.body;

    const existingBid = await Bid.find({ productId })
      .sort({ amount: -1 })
      .limit(1);
    const currentHighest = existingBid.length > 0 ? existingBid[0].amount : 0;

    if (amount <= currentHighest) {
      return res
        .status(400)
        .json({ message: "Bid must be higher than current price" });
    }

    const newBid = new Bid({ productId, bidder: bidderId, amount });
    await newBid.save();

    res.status(201).json(newBid);
  } catch (error) {
    res.status(500).json({ message: "Error placing bid", error });
  }
};
