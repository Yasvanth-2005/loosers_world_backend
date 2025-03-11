import UpcomingToken from "../models/UpcomingToken.js";

// Get all upcoming tokens
export const getAllUpcomingTokens = async (req, res) => {
  try {
    const tokens = await UpcomingToken.find({ status: "upcoming" })
      .populate("creator", "username profilePicture")
      .sort({ launchDate: 1 })
      .limit(5);

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create upcoming token
export const createUpcomingToken = async (req, res) => {
  try {
    const { name, description, image, launchDate, links, initialPrice } =
      req.body;

    const token = new UpcomingToken({
      name,
      description,
      image,
      launchDate,
      links,
      initialPrice,
      creator: req.user._id,
    });

    await token.save();
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update token status
export const updateTokenStatus = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    const token = await UpcomingToken.findById(tokenId);
    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    // Only creator can update status
    if (!token.creator.equals(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    token.status = status;
    await token.save();
    res.json(token);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
