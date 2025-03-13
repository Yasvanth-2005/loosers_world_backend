import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/jwt.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const checkWallet = async (req, res) => {
  try {
    const { walletId } = req.body;
    const user = await User.findOne({ walletId })
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture")
      .populate("tokens");

    if (user) {
      const token = generateToken(user._id);
      res.json({ exists: true, user, token });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { walletId, username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const existingWallet = await User.findOne({ walletId });
    if (existingWallet) {
      return res.status(400).json({ error: "Wallet is already registered" });
    }

    const user = new User({
      username,
      walletId,
      isVerified: false,
      credits: 0,
    });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture")
      .populate("tokens");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const isFollowing = req.user.following.includes(userId);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: req.user._id },
      });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: req.user._id },
      });
    }

    const updatedUser = await User.findById(req.user._id)
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to fetch updated user" });
    }

    console.log(updatedUser);
    console.log(isFollowing);
    res.json({
      message: isFollowing ? "Unfollowed" : "Followed",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["username", "profilePicture", "isVerified"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    updates.forEach((update) => (req.user[update] = req.body[update]));

    if (req.body.isVerified && !req.user.isVerified) {
      req.user.credits = 200;
    }

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture")
      .populate("tokens");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let isFollowing = false;
    let isLiked = false;
    if (req.user) {
      isFollowing = req.user.following.includes(user._id);
      isLiked = user.likes.includes(req.user._id);
    }

    res.json({
      user,
      isFollowing,
      isLiked,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ error: "Cannot like yourself" });
    }

    const isLiked = user.likes.includes(req.user._id);

    if (isLiked) {
      await User.findByIdAndUpdate(userId, {
        $pull: { likes: req.user._id },
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $push: { likes: req.user._id },
      });
    }

    res.json({ message: isLiked ? "Unliked" : "Liked" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserTokens = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "tokens",
      options: { sort: { createdAt: -1 } },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: "i" },
    })
      .select("username profilePicture bio")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
