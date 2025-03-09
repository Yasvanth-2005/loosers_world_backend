import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/jwt.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError);
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export default auth;
