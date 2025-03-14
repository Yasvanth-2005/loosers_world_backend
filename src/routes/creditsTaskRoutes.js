const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAllTasks,
  getUserTasks,
  updateTaskProgress,
  resetDailyTasks,
} = require("../controllers/creditsTaskController");

router.get("/", getAllTasks);

router.get("/user", protect, getUserTasks);
router.put("/:taskId/progress", protect, updateTaskProgress);
router.post("/reset-daily", protect, resetDailyTasks);

module.exports = router;
