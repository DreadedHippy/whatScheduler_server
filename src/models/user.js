import mongoose from "mongoose";

const task = new mongoose.Schema({
	cronJob: String,
	isRunning: Boolean,
	date: Date
})

const schedule = new mongoose.Schema({
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