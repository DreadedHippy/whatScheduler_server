import mongoose from "mongoose";

const task = new mongoose.Schema({
	cronJob: String,
	isRunning: Boolean,
	date: Date
})

const schedule = new mongoose.Schema({
	clientID: String,
	chatIDs: [],
	message: String,
	status: String,
	date: Date
})

const user = new mongoose.Schema({
	email: String,
	password: String,
	schedules: [schedule],
	tasks: [task],
})

const User = mongoose.model('User', user)

export default User