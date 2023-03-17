//Importing modules
import bcrypt from 'bcrypt';;
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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