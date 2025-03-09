import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tags: {
    type: [String],
    default: [],
    validate: [arrayLimit, "Tags cannot exceed 5"],
  },
  links: {
    website: String,
    twitter: String,
    telegram: String,
    discord: String,
  },
  tokenId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: true,
    default: "Tier 1",
    enum: ["Tier 1", "Tier 2", "Tier 3"],
  },
  solAmount: {
    type: "String",
    default: "0",
  },
  symbol: {
    type: String,
    required: true,
  },
  marketCap: {
    type: Number,
    default: 0,
  },
});

function arrayLimit(val) {
  return val.length <= 5;
}

const Token = mongoose.model("Token", tokenSchema);

export default Token;
