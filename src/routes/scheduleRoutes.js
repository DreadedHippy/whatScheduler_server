import express from 'express';
import * as ScheduleController from '../controllers/scheduleController.js';
import checkAuth from '../middleware/check-auth.js';

const router = express.Router();

router.get("/", checkAuth, ScheduleController.getSchedules)
router.post("/create", checkAuth, ScheduleController.setSchedule)

export default router