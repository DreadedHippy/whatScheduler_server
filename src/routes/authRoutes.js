import express from 'express';
import * as AuthController from '../controllers/authController.js'
import checkAuth from '../middleware/check-auth.js';

const router = express.Router();

router.post("/login", AuthController.login)
router.post("/signup", AuthController.signup)
router.post("/verify", AuthController.verify)
router.post("/logout", checkAuth, AuthController.logout)

export default router