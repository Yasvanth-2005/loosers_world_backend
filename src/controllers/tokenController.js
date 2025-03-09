import Token from "../models/Token.js";
import User from "../models/User.js";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createToken = async (req, res) => {
  try {
    const { name, description, links, category, solAmount, marketCap, tags } =
      req.body;
    const imageFile = req.file;

    const parsedLinks = links ? JSON.parse(links) : {};
    const parsedTags = tags ? JSON.parse(tags) : [];

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await cloudinary.uploader.upload(imageFile.path, {
      folder: "tokens",
      transformation: [
        { width: 200, height: 200, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    const tokenId = Math.random().toString(36);
    const token = new Token({
      name,
      description,
      img: result.secure_url,
      creator: req.user._id,
      links: parsedLinks,
      tokenId,
      category,
      solAmount,
      symbol: "Shigga",
      marketCap,
      tags: parsedTags || [],
    });

    await token.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { tokens: token._id },
    });

    res.status(201).json(token);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all tokens
export const getAllTokens = async (req, res) => {
  try {
    const tokens = await Token.find()
      .populate("creator", "username profilePicture")
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user tokens
export const getUserTokens = async (req, res) => {
  try {
    const { userId } = req.params;
    const tokens = await Token.find({ creator: userId })
      .populate("creator", "username profilePicture")
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like/unlike token
export const toggleLike = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = await Token.findById(tokenId);

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    const isLiked = token.likes.includes(req.user._id);

    if (isLiked) {
      await Token.findByIdAndUpdate(tokenId, {
        $pull: { likes: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, { $pull: { likes: tokenId } });
    } else {
      await Token.findByIdAndUpdate(tokenId, {
        $push: { likes: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, { $push: { likes: tokenId } });
    }

    res.json({ message: isLiked ? "Unliked" : "Liked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
