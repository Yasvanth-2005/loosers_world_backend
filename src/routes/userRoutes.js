import express from "express";
import {
  checkWallet,
  registerUser,
  getProfile,
  followUser,
  updateProfile,
  getUserByUsername,
  toggleLike,
  getUserTokens,
  searchUsers,
  verifySocialMedia,
} from "../controllers/userController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/check-wallet", checkWallet);
router.post("/register", registerUser);
router.get("/profile/:username", getUserByUsername);
router.get("/search", searchUsers);

router.get("/profile", auth, getProfile);
router.post("/follow/:userId", auth, followUser);
router.post("/like/:userId", auth, toggleLike);
router.patch("/profile", auth, updateProfile);
router.get("/tokens/:userId", getUserTokens);
router.post("/verify-social", auth, verifySocialMedia);

export default router;
