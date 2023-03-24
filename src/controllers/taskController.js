import User from '../models/user.js'
import nodeSchedule from 'node-schedule'
import EventEmitter from 'events';
import { cacheData, deleteCachedData } from '../middleware/redis-cache.js';
const eventEmitter = new EventEmitter();

const taskMap = new Map()
const alphaRegex = /[^A-Za-z0-9]+/ //Regex pattern to find all that is not alphanumeric

export async function createTask(req, res){
	try{
		const email = req.query.email;
		const name = req.body.name;
		const message = req.body.message;
		const cronJob = req.body.cronJob;
		const chatIDs = req.body.chatIDs;
		const clientID = email.split(alphaRegex).join("")
		const task = { email, name, message, cronJob, chatIDs, clientID, isRunning: true}
		// console.log(task); //Debugging

		
		const user = await User.findOne({email: email})
		const newTask = await user.tasks.create(task)
		const taskID = newTask._id //?Get the id of the new task
		console.log(taskID)
		//Add the task to the task map using the user email and task id as reference
		saveToMap(email, taskID, nodeSchedule.scheduleJob(task.cronJob, function(){
			eventEmitter.emit("send_message", {
				chatIDs,
				clientID,
				message,
				taskID,
				email
			})
		}))

		user.tasks.push(newTask)
		user.save().then( () => {
			res.status(200).json({
				message: "Recurring message created",
				data: {created: true},
				code: "200-createTask"
			})
		})

	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "An error occurred",
			data: {created: false},
			code: "500-createTask"
		})
	}
}

export async function getTasks(req, res){
	const email = req.query.email
	try{
		User.findOne({email: email}).then( (foundUser) => {
			res.status(200).json({
				message: "Tasks found",
				data: {tasks: foundUser.tasks},
				code: "200-getTasks"
			})
		})
	} catch(error){
		console.log("Error finding tasks: ", error)
		res.status(500).json({
			message: "An error occurred",
			data: {tasks: null},
			code: "500-getTasks"
		})
	}
}

export async function stopTask(req, res){
	const email = req.body.email
	const taskID = req.params.id

	try{
		User.findOneAndUpdate(
			{email, "tasks._id": taskID},
			{"tasks.$.isRunning": false}
		).then( result => {
			res.status(200).json({
				message: "Task stopped",
				data: {stopped: true},
				code: "200-stopTask"
			})
			cancelJob(email, taskID)

		}).catch(error => {
			console.log(error)
		})		
	} catch(error){
		console.log("Error stopping task: ", error)
		res.status(500).json({
			message: "An error occurred",
			data: {stopped: false},
			code: "500-stopTask"
		})
	}
}

export async function resumeTask(req, res){
	try{
		const email = req.body.email
		const taskID = req.params.id

		//* Find the task and return the task as the fist element in the "tasks" array
		User.findOne({email, "tasks._id": taskID}, "tasks.$").then(result => {
			const task = result.tasks[0] //Get the task object
			const isResumed = resumeJob(email, task) //Attempt to resume the task
			if(isResumed){ //On successful resumption

				//Update the database
				User.findOneAndUpdate(
					{email, "tasks._id": taskID},
					{"tasks.$.isRunning": true}
				).then( result => { //On successful update, return a response
					res.status(200).json({
						message: "Task resumed",
						data: {resumed: true},
						code: "200-resumeTask"
					})	
				}).catch(error => { //Catch any errors that may occur
					console.log(error)
				})
				return
			}

			//If the task could not be resumed, return a response
			throw new Error("Task could not be resumed")

		}).catch(error => {
			throw error
		})

	} catch(error){
		console.log("Error resuming task: ", error)
		res.status(500).json({
			message: "An error occurred",
			data: {resumed: false},
			code: "500-resumeTask"
		})
	}
}

export async function deleteTask(req, res){
	try{

		const email = req.query.email
		const taskID = req.params.id
		const isJobDeleted = deleteJob(email, taskID);

		if(!isJobDeleted){
			throw new Error("Job could not be deleted")
		}
		

		User.findOne({email: email}).then( (user) => {
			user.tasks.id(taskID).remove()
			user.save(function(err){
				if(err){
					throw new Error("MongoDB: Job could not be deleted")
				}
				
				res.status(200).json({
					message: "Task deleted",
					data: {deleted: true},
					code: "200-deleteTask"
				})
			})
		})
	} catch(err){
		console.log(err)
		res.status(500).json({
			message: "An error occurred",
			data: {deleted: false, error: err},
			code: "500-deleteTask"
		})
	}
}

/**
 * @param {String} email - the email of the user whose task is to be saved
 * @param {string} taskID - the ID of the task to be saved
 * @param {Object} taskBody - the actual task to be saved
 * @returns {void}
 * @description Saves a task to the task map
 * @todo Add a check to see if the task exists before saving it
 * @todo Add a check to see if the task is running before saving it
 * @todo Add a check to see if the task is already saved before saving it
*/

function saveToMap(email, taskID, taskBody){
	if(taskMap.has(email)){
		taskMap.get(email)[taskID] = taskBody;
		return
	}
	//*taskID is wrapped in square brackets to reference it to the "taskID" variable
	taskMap.set(email, {[taskID]: taskBody})
}

/**
 * @param {String} email - the email of the user whose task is to be cancelled
 * @param {string} taskID - the ID of the task to be cancelled
 * @returns {void}
 * @description Cancels a scheduled job
 * @todo Add a check to see if the task is running before cancelling it
 * @todo Add a check to see if the task exists before cancelling it
**/
function cancelJob(email, taskID){
	try{

		if(taskMap.has(email)){
			taskMap.get(email)[taskID].cancel()
			return
		}
	}catch(error){
		console.log("An error occurred whilst cancelling a job", error)
	}
}

function resumeJob(email, task){
	try{

		const taskID = task._id
		if(taskMap.has(email)){
			if(taskMap.get(email)[taskID]){
				const isRescheduled = taskMap.get(email)[taskID].reschedule(task.cronJob)
				return isRescheduled
			}
		}
		saveToMap(email, taskID, nodeSchedule.scheduleJob(task.cronJob, function(){
			eventEmitter.emit("send_message", {
				chatIDs: task.chatIDs,
				clientID: task.clientID,
				message: task.message,
				taskID: task._id,
				email
			})
		}))
		return true
	} catch(error){
		console.log("An error occurred while resuming task: ", error)
		return false
	}
	
}

function deleteJob(email, taskID){
	try{
		if(!taskMap.has(email)){
			return true
		}

		taskMap.get(email)[taskID].cancel()
		delete taskMap.get(email)[taskID]
		return true

	} catch(error){
		console.log("An error occurred whilst deleting a job", error)
		return false
	}
}

//?Sample job for autocomplete
// const job = nodeSchedule.scheduleJob(task.cronJob, function(){ return "Hi"})
// job.reschedule()
export {eventEmitter}