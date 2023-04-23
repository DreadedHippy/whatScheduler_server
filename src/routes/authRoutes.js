import express from 'express';
import * as AuthController from '../controllers/authController.js'
import checkAuth from '../middleware/check-auth.js';
import {body, validationResult} from 'express-validator';

const router = express.Router();

router.post("/login",
	[body('email').isEmail(),	body('password').isLength({ min: 8 }).escape()],

	(req, res, next) => {
  	const errors = validationResult(req);
  	if (!errors.isEmpty()) {
			console.log(errors)
    	return res.status(400).json({ errors: errors.array() });
  	}
		next()
	},
	
	AuthController.login
);

router.post("/signup",
	[body('email').isEmail(),	body('password').isLength({ min: 8 }).escape()],

	(req, res, next) => {
  	const errors = validationResult(req);
 		if (!errors.isEmpty()) {
			console.log(errors)
    	return res.status(400).json({ errors: errors.array() });
 		}
		next()
	},

	AuthController.signup
);
router.post("/verify", AuthController.verify)
router.post("/logout", checkAuth, AuthController.logout)

export default router

