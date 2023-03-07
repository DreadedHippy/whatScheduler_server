import express from 'express';
import * as ScheduleController from '../controllers/scheduleController.js';
import checkAuth from '../middleware/check-auth.js';

const router = express.Router();

router.get("/", checkAuth, ScheduleController.getSchedules)

export default router