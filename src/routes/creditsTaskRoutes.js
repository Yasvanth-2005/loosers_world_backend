import express from "express";
const router = express.Router();

import auth from "../middleware/auth.js";
import {
  getAllTasks,
  getUserTasks,
  updateTaskProgress,
  resetDailyTasks,
  addCreditTasks,
} from "../controllers/creditsTaskController.js";

router.post("/add-tasks", addCreditTasks);
router.get("/", getAllTasks);
router.get("/user", auth, getUserTasks);
router.put("/:taskId/progress", auth, updateTaskProgress);
router.post("/reset-daily", auth, resetDailyTasks);

export default router;
