import User from "../models/user.js";
import jwt from "jsonwebtoken"
import nodeSchedule from "node-schedule";
import EventEmitter from 'events';
const eventEmitter = new EventEmitter();

let schedules = {};
const alphaRegex = /[^A-Za-z0-9]+/ //Regex pattern to find all that is not alphanumeric

export function getSchedules(req, res){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const decodedToken = jwt.decode(token, {
			complete: true
		})
		const payloadEmail = decodedToken.payload.email

		User.findOne({email: payloadEmail}).then( user => {
			res.status(200).json({
				message: "Schedules retrieved",
				data: {schedules: user.schedules},
				code: "200-getSchedules"
			})
		})
	}
	catch(error){
		res.status(500).json({
			message: "An error has occured!",
			data: {error},
			code: "500-getSchedules"
		})
	}
}

export async function setSchedule(req, res){
	try{
		const email = req.query.email
		const clientID = email.split(alphaRegex).join("")
		const chatIDs = req.body.chatIDs
		const message = req.body.message
		const date = new Date(req.body.date)
		
		const schedule = {
			chatIDs,
			clientID,
			message,
			date,
			status: "pending"
		}

		User.findOne({email: email}).then( async(foundUser) => { //find a user in the db
			// console.log(foundUser) //debug: print out the found user
			const newSchedule = await foundUser.schedules.create(schedule) //Create a new schedule
			const scheduleID = newSchedule._id //? Get the id of the new schedule

			//Add the new schedule to the "schedules" object using the user email and schedule ID as reference
			schedules[email+"|"+scheduleID] = nodeSchedule.scheduleJob(schedule.date, function(){
				eventEmitter.emit("send_message", {
					chatIDs,
					clientID,
					message,
					date,
					scheduleID,
					email		
				})
			})

			//add the schedule to the sub-document array in the db
			foundUser.schedules.push(newSchedule);

			//update the database
			foundUser.save().then( result => {				
				res.status(200).json({ //return a response
					message: "Message scheduled!",
					data: {scheduled: true},
					code: "200-setSchedule"
				})
			})
		})
	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "Something went wrong",
			data: {scheduled: false},
			code: "500-setSchedule"
		})
	}
}

eventEmitter.on("message_sent", async (info) => { //Update schedule state to 'sent' in the db
	try {
		User.findOneAndUpdate(
			{email: info.email, "schedules._id": info.scheduleID},
			{"schedules.$.status" : "sent"}	
		).then( result => {
			console.log("Updated")
		}).catch(error => {console.log(error)})

	} catch(error){
		console.log(error)
	}
})

eventEmitter.on("expire_schedule", (info) => {
	try{
		User.findOneAndUpdate(
			{email: info.email, "schedules._id": info.scheduleID},
			{"schedules.$.status" : "expired"}	
		).then( result => {
			console.log(result)
			console.log("update: expired")
		}).catch(error => {console.log(error)})

	} catch(error){
		console.log(error)
	}
})

export {eventEmitter}