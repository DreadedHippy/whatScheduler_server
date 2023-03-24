import express from 'express';
import * as TaskController from '../controllers/taskController.js'
import checkAuth from '../middleware/check-auth.js';
import { cachedTasks } from '../middleware/redis-cache.js';

const router = express.Router();

// router.get("/", checkAuth, cachedSchedules, ScheduleController.getSchedules)
router.post("/create", checkAuth, TaskController.createTask)
router.get("/", checkAuth, TaskController.getTasks)
router.patch("/:id/stop", checkAuth, TaskController.stopTask)
router.patch("/:id/resume", checkAuth, TaskController.resumeTask)
router.delete("/:id/delete", checkAuth, TaskController.deleteTask)

export default router