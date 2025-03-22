import mongoose from "mongoose";

const creditsTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    progress: {
      type: String,
      required: true,
      default: "0/1",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "one-time"],
      required: true,
    },
    task: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastReset: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CreditsTask = mongoose.model("CreditsTask", creditsTaskSchema);
export default CreditsTask;
