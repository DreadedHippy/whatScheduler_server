//Importing modules
import bcrypt from 'bcrypt';;
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as Mailer from '../utils/mailer.js';
import * as ScheduleController from '../controllers/scheduleController.js';
import * as ClientController from '../controllers/clientController.js';
import * as TaskController from '../controllers/taskController.js';
dotenv.config()

export async function login(req, res){
	try{
		const email = req.body.email
		const password = req.body.password

		User.findOne({email: email}).then( foundUser => {
			if(!foundUser){
				res.status(401).json({
					message: "Not recognized, try signing up",
					data: {},
					code: "401-login"
				})
				return
			}
			if (!foundUser.isVerified){
				res.status(401).json({
					message: "Not verified! Please verify with email link",
					data: {},
					code: "401-login"
				})
				return
			}
			const token = jwt.sign({email, id: foundUser._id}, process.env.JWT_SECRET, {expiresIn: '1h'}) //generate auth token
			bcrypt.compare(password, foundUser.password)
			.then(passwordMatches => {
				if(passwordMatches){
					res.status(200).json({
						message: "Authenticated!",
						data: {
							saved: false,
							user: foundUser,
							token, 
							expiresIn: 3600 //1 hour to seconds
						},
						code: "200-login"
					})
					ScheduleController.retrieveSchedules(email) //retrieve schedules from db
				}
			}).catch(err => {
				res.status(401).json({
					message: "Invalid credentials!",
					data: {},
					code: "401-login"
				})

			})
		}).catch((err) => { throw new Error(err)	})
	} catch(err){
		console.log(err);
		res.status(500).json({
			message: "Something went wrong...",
			data: {},
			code: "500-login"
		})
	}
}

export async function signup(req, res){
	try {
		const origin = req.headers.origin
		const email = req.body.email
		const foundUser = await User.findOne({email})
		if(foundUser){
			throw new Error("User already exists")
		}
		const hash = await bcrypt.hash(req.body.password, 10)
		const token = jwt.sign({email}, process.env.VERIFICATION_HASH, {expiresIn: '1h'})
		const verificationToken = token
		const user = new User({
			email,
			password: hash,
			tasks: [],
			schedules: [],
			verificationToken
		})
		await user.save()
		const verificationLink = `${origin}/verify?token=${verificationToken}`
		await Mailer.sendVerificationMail(email, verificationLink)
		res.status(201).json({
			message: "User Created! Please verify with email link",
			data: {
				saved: true,
				user,
			},
			code: "201-login"
		})
	}
	catch(err){
		console.log("An error has occurred: ",err)
		if(err.message === "User already exists"){
			res.status(409).json({
				message: err.message,
				data: {},
				code: "409-signup"
			})
			return
		}
		res.status(500).json({
			message: err.message,
			data: {},
			code: "500-signup"
		})
	}
}

export async function verify(req, res){
	try{
		const token = req.body.token
		const decoded = jwt.decode(token, process.env.VERIFICATION_HASH)
		const email = decoded.email
		const foundUser = await User.findOne({email: email})
		if(!foundUser){
			throw new Error("User not found")
		}
		if(foundUser.isVerified){
			res.status(200).json({
				message: "Already verified!",
				data: {
					verified: true
				},
				code: "200-verify"
			})
			return
		}
		if(foundUser.verificationToken !== token){
			throw new Error("Invalid token")
		}
		foundUser.isVerified = true
		await foundUser.save()
		res.status(200).json({
			message: "Verified!",
			data: {
				verified: true
			},
			code: "200-verify"
		})
	}catch(err){
		switch(err.message){
			case "User not found":
				res.status(404).json({
					message: err.message,
					data: {},
					code: "404-verify"
				})
				break;
			case "Invalid token":
				res.status(400).json({
					message: err.message,
					data: {},
					code: "400-verify"
				})
				break;
			default:
				res.status(500).json({
					message: "Something went wrong... try again later",
					data: {},
					code: "500-verify"
				})
		}
	}
}

export async function logout(req, res){
	try {
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.decode(token, process.env.JWT_SECRET)
		const email = payload.email
		await ClientController.clearClient(email)
		await ScheduleController.clearSchedules(email)
		await TaskController.clearTasks(email)
		res.status(200).json({
			message: "Logged out Successfully",
			data: {},
			code: "200-logout"
		})
	}catch(error){
		console.log(error)
		res.status(500).json({
			message: "Something went wrong...",
			data: {},
			code: "500-logout"
		})

	}
}