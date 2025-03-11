import express from "express";
import auth from "../middleware/auth.js";
import {
  getAllUpcomingTokens,
  createUpcomingToken,
  updateTokenStatus,
} from "../controllers/upcomingTokenController.js";

const router = express.Router();

// Public routes
router.get("/", getAllUpcomingTokens);
router.post("/create", auth, createUpcomingToken);
router.patch("/:tokenId", auth, updateTokenStatus);

export default router;
