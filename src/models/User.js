import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  walletId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  socialVerification: {
    google: {
      isVerified: { type: Boolean, default: false },
      url: { type: String, default: "" },
    },
    x: {
      isVerified: { type: Boolean, default: false },
      url: { type: String, default: "" },
    },
    telegram: {
      isVerified: { type: Boolean, default: false },
      url: { type: String, default: "" },
    },
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  credits: {
    type: Number,
    default: 0,
  },
  earnings: {
    type: Number,
    default: 0,
  },
  tokens: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
    },
  ],
  profilePicture: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
