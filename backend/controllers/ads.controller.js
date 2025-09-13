exports.getAdsByUser = async (req, res) => {
  const username = req.params.username;
  try {
    const ads = await Ad.find({ "bids.user": username });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
