import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";
const task = new mongoose.Schema({
	name: String,
	cronJob: String,
	isRunning: Boolean,
	date: Date
})

const schedule = new mongoose.Schema({
	clientID: {type: String, required: true, unique: true},
	chatIDs: [],
	message: String,
	status: String,
	date: Date
})

const user = new mongoose.Schema({
	email: {type: String, required: true, unique: true},
	password: {type: String, required: true, unique: true},
	schedules: [schedule],
	tasks: [task],
})

user.plugin(mongooseUniqueValidator)

const User = mongoose.model('User', user)

export default User