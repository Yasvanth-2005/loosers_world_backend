import CreditsTask from "../models/CreditsTask.js";
import User from "../models/User.js";

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await CreditsTask.find({ isActive: true });
    res.status(200).json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get user's tasks with progress
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await CreditsTask.find({ isActive: true });

    // Get user's task progress
    const user = await User.findById(userId).select("taskProgress");
    const userProgress = user.taskProgress || {};

    // Combine tasks with user's progress
    const tasksWithProgress = tasks.map((task) => ({
      ...task.toObject(),
      progress: userProgress[task._id] || task.progress,
      status: userProgress[task._id] === "1/1" ? "completed" : "pending",
    }));

    res.status(200).json(tasksWithProgress);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user tasks", error: error.message });
  }
};

// Update task progress
export const updateTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await CreditsTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get user's current progress
    const user = await User.findById(userId);
    const currentProgress = user.taskProgress?.[taskId] || "0/1";
    const [current, total] = currentProgress.split("/").map(Number);

    // Check if task is already completed
    if (current >= total) {
      return res.status(400).json({ message: "Task already completed" });
    }

    // Update progress
    const newProgress = `${current + 1}/${total}`;

    // Update user's task progress
    await User.findByIdAndUpdate(userId, {
      $set: { [`taskProgress.${taskId}`]: newProgress },
    });

    // If task is completed, add credits to user
    if (current + 1 >= total) {
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: task.credits },
      });
    }

    res.status(200).json({
      message: "Task progress updated",
      progress: newProgress,
      credits: task.credits,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task progress", error: error.message });
  }
};

// Reset daily tasks
export const resetDailyTasks = async (req, res) => {
  try {
    const tasks = await CreditsTask.find({ type: "daily", isActive: true });
    const now = new Date();

    for (const task of tasks) {
      const lastReset = new Date(task.lastReset);
      const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        await CreditsTask.findByIdAndUpdate(task._id, {
          lastReset: now,
          progress: "0/1",
          status: "pending",
        });
      }
    }

    res.status(200).json({ message: "Daily tasks reset successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting daily tasks", error: error.message });
  }
};
