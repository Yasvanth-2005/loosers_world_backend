import mongoose from "mongoose";

const upcomingTokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    launchDate: {
      type: Date,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    links: {
      website: String,
      twitter: String,
      telegram: String,
      discord: String,
    },
    status: {
      type: String,
      enum: ["upcoming", "launched", "cancelled"],
      default: "upcoming",
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    initialPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UpcomingToken = mongoose.model("UpcomingToken", upcomingTokenSchema);

export default UpcomingToken;
