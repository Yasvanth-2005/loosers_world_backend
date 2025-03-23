import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/jwt.js";
import CreditsTask from "../models/CreditsTask.js";

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
    const user = await User.findById(req.user._id);

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

    // Handle "Follow 10 Users" task for the follower
    const followTask = await CreditsTask.findOne({
      title: "Follow 10 Users",
      type: "one-time",
    });

    if (followTask) {
      const currentProgress = req.user.taskProgress.get(
        `${followTask._id}`
      ) || {
        current: 0,
        total: parseInt(followTask.progress.split("/")[1]),
      };

      let newCurrent = currentProgress.current;
      if (isFollowing) {
        newCurrent =
          currentProgress.current < 10
            ? currentProgress.current - 1
            : currentProgress.current;
      } else {
        newCurrent =
          currentProgress.current < 10
            ? currentProgress.current + 1
            : currentProgress.current;
      }

      const newProgress = {
        current: Math.max(0, Math.min(newCurrent, currentProgress.total)),
        total: currentProgress.total,
      };

      await User.findByIdAndUpdate(req.user._id, {
        $set: { [`taskProgress.${followTask._id}`]: newProgress },
      });

      if (
        newProgress.current === currentProgress.total &&
        (!currentProgress.status || currentProgress.status !== "completed")
      ) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { credits: followTask.credits },
          $set: { [`taskProgress.${followTask._id}.status`]: "completed" },
        });
      }
    }

    // Handle "Get 100 Followers" task for the user being followed
    const followersTask = await CreditsTask.findOne({
      title: "Get 100 Followers",
      type: "one-time",
    });

    if (followersTask) {
      const currentFollowersProgress = user.taskProgress.get(
        `${followersTask._id}`
      ) || {
        current: 0,
        total: 100,
      };

      if (currentFollowersProgress.current !== currentFollowersProgress.total) {
        const followerCount = isFollowing
          ? Math.max(0, currentFollowersProgress.current - 1)
          : Math.min(100, currentFollowersProgress.current + 1);

        const newFollowersProgress = {
          current: followerCount,
          total: currentFollowersProgress.total,
        };

        await User.findByIdAndUpdate(userId, {
          $set: { [`taskProgress.${followersTask._id}`]: newFollowersProgress },
        });

        if (followerCount === 100 && currentFollowersProgress.current < 100) {
          await User.findByIdAndUpdate(userId, {
            $inc: { credits: followersTask.credits },
          });
        }
      }
    }

    const updatedUser = await User.findById(req.user._id)
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to fetch updated user" });
    }

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
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followers = await User.find({ _id: { $in: user.followers } }).select(
      "username profilePicture"
    );
    const following = await User.find({ _id: { $in: user.following } }).select(
      "username profilePicture"
    );

    let isFollowing = false;
    let isLiked = false;
    if (req.user) {
      isFollowing = req.user.following.includes(user._id);
      isLiked = user.likes.includes(req.user._id);
    }

    res.json({
      user,
      followers,
      following,
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
      populate: {
        path: "creator",
        select: "username profilePicture",
      },
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

export const verifySocialMedia = async (req, res) => {
  try {
    const { platform, profileUrl } = req.body;
    const userId = req.user._id;

    if (!["google", "x", "telegram"].includes(platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await User.findOne({
      [`socialVerification.${platform}.url`]: profileUrl,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({
        error: `This ${platform} profile is already verified by another user`,
      });
    }

    if (!user.socialVerification) {
      user.socialVerification = {
        google: { isVerified: false, url: "" },
        x: { isVerified: false, url: "" },
        telegram: { isVerified: false, url: "" },
      };
    }

    user.socialVerification[platform] = {
      isVerified: true,
      url: profileUrl,
    };

    const wasVerifiedBefore = user.isVerified;
    user.isVerified =
      user.socialVerification.x.isVerified &&
      user.socialVerification.telegram.isVerified;

    if (!wasVerifiedBefore && user.isVerified) {
      const verificationTask = await CreditsTask.findOne({
        title: "Get Verified",
        type: "one-time",
      });

      if (verificationTask) {
        user.taskProgress.set(verificationTask._id, {
          current: 1,
          total: verificationTask.progress.split("/")[1],
        });

        user.credits += verificationTask.credits;

        verificationTask.status = "completed";
        await verificationTask.save();
      }
    }

    await user.save();

    res.json({
      message: `${platform} account verified successfully`,
      socialVerification: user.socialVerification,
      isVerified: user.isVerified,
      credits: user.credits,
    });
  } catch (error) {
    console.error("Error verifying social media:", error);
    res.status(500).json({ error: "Failed to verify social media account" });
  }
};
