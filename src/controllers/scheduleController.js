import User from "../models/user.js";
import jwt from "jsonwebtoken"


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