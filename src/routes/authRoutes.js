import express from 'express';
import * as AuthController from '../controllers/authController.js'

const router = express.Router();

router.get("/", AuthController.ping)

export default router