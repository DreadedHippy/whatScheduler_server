//Importing modules
import bcrypt from 'bcrypt';;
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as Mailer from '../utils/mailer.js'
import * as ScheduleController from '../controllers/scheduleController.js'
dotenv.config()

export async function login(req, res, next){
	// console.log("Pinged!");
	const email = req.body.email
	const password = req.body.password

	//TODO: Add signup logic separately

	User.findOne({email: email}).then( foundUser => {
		console.log("pinged")
		//If the user does not exist
		if(!foundUser){
			bcrypt.hash(password, 10).then(hash => {
				const user = new User({ //create new user
					email: email,
					password: hash,
					tasks: [],
					schedules: []
				})
				user.save() //save the user to the db
				.then( user => { ///user successfully saved
					console.log("User saved");
					const token = jwt.sign({email, id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'}) //generate auth token
					res.status(201).json({
						message: "User Created!",
						data: {
							saved: true,
							user,
							token,
							expiresIn: 3600 //1 hour to seconds
						},
						code: "201-login"
					})
					ScheduleController.retrieveSchedules(email) //retrieve schedules from db
				})
				.catch(error => { //user not saved
					console.error("An error has occured: " + error);
					res.status(500).json({
						message: "An error has occured",
						data: {saved: false},
						code: "500-login"
					})
				})
			})
			return
		}

		//If the User exists
		const token = jwt.sign({email, id: foundUser._id}, process.env.JWT_SECRET, {expiresIn: '1h'}) //generate auth token
		bcrypt.compare(req.body.password, foundUser.password)
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
	})
}

export async function signup(req, res){
	try {
		const protocol = req.protocol
		const host = req.headers.host
		const email = req.body.email
		const foundUser = await User.findOne({email})
		if(foundUser){
			throw new Error("User already exists")
		}
		const hash = await bcrypt.hash(req.body.password, 10)
		const token = jwt.sign({email}, process.env.VERIFICATION_HASH, {expiresIn: '1h'})
		const verificationToken = token.toString().slice(0, 15)
		const user = new User({
			email,
			password: hash,
			tasks: [],
			schedules: [],
			verificationToken
		})
		await user.save()
		const verificationLink = `${protocol}://${host}/verify?token=${verificationToken}`
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