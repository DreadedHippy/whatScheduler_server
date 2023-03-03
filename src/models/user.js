import mongoose from "mongoose";

const task = new mongoose.Schema({
	cronJob: String,
	isRunning: Boolean,
	date: Date
})

const user = new mongoose.Schema({
	email: String,
	password: String,
	tasks: [task]
})

const User = mongoose.model('User', user)

export default User