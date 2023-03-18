import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";
const task = new mongoose.Schema({
	name: {type: String, required: true},
	message: {type: String, required: true},
	chatIDs: [],
	cronJob: {type: String, required: true},
	isRunning: Boolean,
	clientID: {type: String, required: true}
})

const schedule = new mongoose.Schema({
	clientID: {type:String},
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