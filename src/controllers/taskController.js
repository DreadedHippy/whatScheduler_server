import User from '../models/user.js'
import nodeSchedule from 'node-schedule'
import EventEmitter from 'events';
const eventEmitter = new EventEmitter();

const taskMap = new Map()
const alphaRegex = /[^A-Za-z0-9]+/ //Regex pattern to find all that is not alphanumeric

export async function createTask(req, res){
	try{
		const email = req.query.email;
		const name = req.body.name;
		const message = req.body.message;
		const cronJob = req.body.cronString;
		const chatIDs = req.body.chatIDs;
		const clientID = email.split(alphaRegex).join("")
		const task = { email, name, message, cronJob, chatIDs, clientID, isRunning: true}
		console.log(task);

		
		const user = await User.findOne({email: email})
		const newTask = await user.tasks.create(task)
		const taskID = newTask._id //?Get the id of the new task		
		const taskBody = nodeSchedule.scheduleJob(task.cronJob, function(){
			eventEmitter.emit("send_message", {
				chatIDs,
				clientID,
				message,
				taskID,
				email
			})
		})
		//Add the task to the task map using the user email and task id as reference
		saveToMap(email, taskID, taskBody)

		user.tasks.push(newTask)
		user.save().then( () => {
			res.status(200).json({
				message: "Recurring message created",
				data: {created: true},
				code: "200-createTask"
			})
		})


		// user.tasks.create()

	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "An error occurred",
			data: {created: false},
			code: "500-createTask"
		})
	}
}

function saveToMap(email, taskID, taskBody){
	if(taskMap.has(email)){
		taskMap.get(email)[taskID] = taskBody;
		return
	}
	taskMap.set(email, {taskID: taskBody})
}

export {eventEmitter}