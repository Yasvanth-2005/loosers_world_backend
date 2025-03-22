import CreditsTask from "../models/CreditsTask.js";
import User from "../models/User.js";

// Add credit tasks
export const addCreditTasks = async (req, res) => {
  try {
    const tasks = [
      {
        title: "Create Your First Token",
        description: "Create and launch your first token on our platform",
        credits: 50,
        progress: "0/1",
        type: "one-time",
        isActive: true,
      },
      {
        title: "Follow 10 Users",
        description: "Connect with other users by following them",
        credits: 30,
        progress: "0/10",
        type: "one-time",
        isActive: true,
      },
      {
        title: "Get 100 Followers",
        description: "Build your community and get followers",
        credits: 100,
        progress: "0/100",
        type: "one-time",
        isActive: true,
      },
      {
        title: "Daily Login",
        description: "Login to the platform daily",
        credits: 10,
        progress: "0/1",
        type: "daily",
        isActive: true,
      },
      {
        title: "Share Your Token",
        description: "Share your token on social media",
        credits: 20,
        progress: "0/1",
        type: "one-time",
        isActive: true,
      },
    ];

    // Delete existing tasks
    // await CreditsTask.deleteMany({});

    const createdTasks = await CreditsTask.insertMany(tasks);

    res.status(201).json({
      message: "Credit tasks added successfully",
      tasks: createdTasks,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding credit tasks", error: error.message });
  }
};

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
    const tasks = await CreditsTask.find({ isActive: true });

    // If user is not logged in, return tasks without progress
    if (!req.user) {
      const tasksWithoutProgress = tasks.map((task) => ({
        ...task.toObject(),
        progress: {
          current: 0,
          total: parseInt(task.progress.split("/")[1]) || 1,
        },
        status: "pending",
      }));
      return res.status(200).json(tasksWithoutProgress);
    }

    // For logged in users, get their progress
    const userId = req.user._id;
    const user = await User.findById(userId).select("taskProgress");
    const userProgress = user.taskProgress || new Map();

    const tasksWithProgress = tasks.map((task) => {
      const taskId = task._id.toString();
      const userTaskProgress = userProgress.get(taskId) || {
        current: 0,
        total: 1,
      };
      const [_, total] = task.progress.split("/").map(Number);

      return {
        ...task.toObject(),
        progress: {
          current: userTaskProgress.current,
          total: userTaskProgress.total || total,
        },
        status:
          userTaskProgress.current === userTaskProgress.total
            ? "completed"
            : "pending",
      };
    });

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
