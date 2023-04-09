import express from 'express';
import * as AuthController from '../controllers/authController.js'

const router = express.Router();

router.post("/login", AuthController.login)
router.post("/signup", AuthController.signup)

export default router