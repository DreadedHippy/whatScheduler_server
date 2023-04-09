import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";
const task = new mongoose.Schema({
	name: {type: String, required: true},
	message: {type: String, required: true},
	cronJob: {type: String, required: true},
	chatIDs: [],
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
	verificationToken: {type: String},
	isVerified: {type: Boolean, default: false},
	schedules: [schedule],
	tasks: [task],
})

user.plugin(mongooseUniqueValidator)

const User = mongoose.model('User', user)

export default User