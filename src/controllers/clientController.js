//importing dependencies
import wweb from 'whatsapp-web.js'
import * as ScheduleController from './scheduleController.js';
import * as TaskController from './taskController.js';
import { cacheData, deleteCachedData } from '../middleware/redis-cache.js';
import jwt from 'jsonwebtoken';
import { eventEmitter } from '../app.js';

const {Client, RemoteAuth} = wweb
let clients = {};
let clientMap = new Map()
const alphaRegex = /[^A-Za-z0-9]+/ //Regex pattern to find all that is not alphanumeric

export function connectSocket(io, store){
	try{
		io.on('connection', (socket) => {
			//Connect client function
			socket.on("connect_client", (id) => {
				const clientID = id.split(alphaRegex).join("_")

				if(!clientID){
					socket.emit("invalid_id")
					return
				}

				//If the client is a valid client and the client is connected
				if(clientMap.has(clientID) && clientMap.get(clientID).info){
					socket.emit("client_ready");
					return
				}
			
				let client = new Client({
					authStrategy: new RemoteAuth({
						store: store,
						clientId: clientID,
						backupSyncIntervalMs: 300000,
					}),
					puppeteer: {
						args: ["--no-sandbox"]
					}
				})

				clientMap.set(clientID, client)
			
				clientMap.get(clientID).on("qr", qr => {
					socket.emit("qrcode", qr)
				})

				clientMap.get(clientID).on("authenticated", (session) => {
					socket.emit("authenticated")
				})
			
				clientMap.get(clientID).on("remote_session_saved", () => {
					socket.emit("client_ready")
				})
				
				clientMap.get(clientID).on("ready", () => {
					if(store.sessionExists(clientID)){						
						socket.emit("client_ready")
					}
				})
			
				clientMap.get(clientID).initialize()
			});
		});		
	}catch(err){
		console.log(err)
	}
}

export async function getClientChats(req, res){
	try{		
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.decode(token, process.env.JWT_SECRET)
		const email = decoded.email;
		const clientID = email.split(alphaRegex).join("_")

		clientMap.get(clientID).getChats().then((result) => {
			res.status(200).json({
				message: "Chats retrieved",
				data: {chats: result},
				code: "200-getClientChats"
			})
			cacheData(email+"-chats", result, 300)
		}).catch( err => {
			console.log(err)
			res.status(500).json({
				message: "An error occurred, try reconnecting",
				data: {},
				code: "500-getClientChats"
			})
		})
	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "Something went wrong",
			data: {},
			code: "500-getClientChats"
		})
	}	
}

export async function sendMessage(req, res){

	try{
		const email = req.query.email
		const clientID = email.split(alphaRegex).join("_")

		//If client disconnected for some reason
		if(!clientMap.has(clientID)){
			res.status(400).json({
				message: "Message cannot be sent, try reconnecting",
				data: {sent: false},
				code: "400-sendMessage"
			})
			return
		}
		console.log(req.body)

		const chatIDs = req.body.chatIDs
		const message = req.body.message;
		const isInstant = req.body.isInstant;
		const date = req.body.date

		// console.log(req.body) //Debugging

		if(isInstant){
			for(let chatID of chatIDs){
				await clientMap.get(clientID).sendMessage(chatID, message, {sendSeen: false})
			}
			res.status(200).json({
				message: "Message sent!",
				data: {sent:true},
				code: "200-sendMessage"
			})
			return
		}

		if(!isInstant){
			ScheduleController.setSchedule({clientID, chatIDs, message, date})
			res.status(200).json({
				message: "Still setting things up",
				data: {sent:true},
				code: "200-sendMessage-alt"
			})	
		}
		
	} catch(error){
		console.log(error);
		res.status(500).json({
			message: "Something went wrong...",
			data: {sent: false},
			code: "500-sendMessage"
		})
	}
}

//*Listening for events from other controllers
ScheduleController.eventEmitter.on("send_message", (info) => {
	sendScheduled(info.clientID, info.chatIDs, info.message, info.scheduleID, info.email)
})

TaskController.eventEmitter.on("send_message", (info) => {
	sendRecurring(info.clientID, info.chatIDs, info.message, info.taskID, info.email)
})

/**
 * 
 * @param {string} clientID 
 * @param {string[]} chatIDs The IDs of the chats to send the message to
 * @param {string} message The message to be sent
 * @param {string} scheduleID The ID of the scheduled message
 * @param {string} email The email of the user who scheduled the message(used for logging purposes)
 * @returns {void}
 */

export async function sendScheduled(clientID, chatIDs, message, scheduleID, email){
	try{
		if(!clientMap.has(clientID)){
			console.log("invalid client")
			ScheduleController.eventEmitter.emit("expire_schedule", {email, scheduleID})
			return
		}
		if(clientMap.has(clientID)){

			if(!clientMap.get(clientID).info){
				console.log("Invalid client session")
				ScheduleController.eventEmitter.emit("expire_schedule", {email, scheduleID})
				return
			}
			for( const chatID of chatIDs){
				clientMap.get(clientID).sendMessage(chatID, message, {sendSeen: false}).then( result => {
					ScheduleController.eventEmitter.emit("message_sent", {scheduleID, email})
				})
			}
		}
	} catch(error) {
		console.log(error)
	}
}

/**
 * @description Sends a message to a list of chats
 * @param {string} clientID - The client ID
 * @param {string[]} chatIDs - The chat IDs
 * @param {string} message - The message to be sent
 * @param {string} taskID - The ID of the recurring task
 * @param {string} email - The email of the user
 * @returns {void}
*/
export async function sendRecurring(clientID, chatIDs, message, taskID, email){
	try{
		if(!clientMap.has(clientID)){
			console.log("invalid client")
			TaskController.eventEmitter.emit("expire_schedule", {email, taskID})
			return
		}
		if(clientMap.has(clientID)){
			if(!clientMap.get(clientID).info){
				console.log("Invalid client session")
				return
			}
			for( const chatID of chatIDs){
				clientMap.get(clientID).sendMessage(chatID, message, {sendSeen: false}).then( result => {
					TaskController.eventEmitter.emit("message_sent", {email, taskID})
				})
			}
		}
	} catch(error) {
		console.log(error)
	}	
}

/**
 * @description Disconnects client from WhatsApp Web
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Returns a JSON object
*/

export async function disconnectClient(req, res){
	try{
		const email = req.query.email
		clearClient(email).then( result => {
			res.status(200).json({
				message: "Client disconnected",
				data: {disconnected: true},
				code: "200-disconnectClient"
			})
		}).catch( error => {
			throw new Error(error)
		})
	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "Something went wrong",
			data: {},
			code: "500-disconnectClient"
		})
	}
}

export async function clearClient(email){
	return new Promise((resolve, reject) => {
		try{
			const clientID = email.split(alphaRegex).join("_")
			if(clientMap.has(clientID)){
				console.log("ID is valid")
				if(clientMap.get(clientID).info){
					console.log("Client is running")
					clientMap.get(clientID).destroy().then(() => {
						clientMap.delete(clientID)	//Set client to undefined to bypass initialization guard
					}).catch( error => console.log(error))
				}
			}
			resolve(true)
			deleteCachedData(email)
		} catch(error){
			console.log(error)
			reject(error)
		}
	})
	
}



// const testClient = new Client({
// 	authStrategy: new RemoteAuth({
		
// 	}),
// 	puppeteer: {

// 	}
// })
// testClient.initialize() //Test client for vscode intellisense


