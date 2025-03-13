import express from "express";
import multer from "multer";
import {
  createToken,
  getAllTokens,
  getUserTokens,
  toggleLike,
  getTokenById,
} from "../controllers/tokenController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
});

router.get("/", getAllTokens);
router.get("/user/:userId", getUserTokens);
router.get("/token/:tokenId", getTokenById);

router.post("/create", auth, upload.single("image"), createToken);
router.post("/:tokenId/like", auth, toggleLike);

export default router;
