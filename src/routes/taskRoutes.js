import express from 'express';
import * as TaskController from '../controllers/taskController.js'
import checkAuth from '../middleware/check-auth.js';
import { cachedSchedules } from '../middleware/redis-cache.js';

const router = express.Router();

// router.get("/", checkAuth, cachedSchedules, ScheduleController.getSchedules)
router.post("/create", checkAuth, TaskController.createTask)

export default router