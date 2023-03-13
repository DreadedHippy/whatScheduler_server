//importing dependencies
import wweb from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
import * as ScheduleController from './scheduleController.js';
import { cacheData, deleteCachedData } from '../middleware/redis-cache.js';

const {Client, LocalAuth} = wweb

let clients = {};
const alphaRegex = /[^A-Za-z0-9]+/ //Regex pattern to find all that is not alphanumeric

export function connectSocket(io){
	io.on('connection', (socket) => {
		//Connect client function
		socket.on("connect_client", (id) => {
			// console.log("CLIENT_CONTROLLER: Angular frontend connected")
			const clientID = id.split(alphaRegex).join("")

			if(!clientID){
				socket.emit("invalid_id")
				return
			}

			if(clients[clientID]){ //if the client is a valid client
				if(clients[clientID].info){  //If the client is connected
					socket.emit("client_ready");
					return
				}
			}
		
			clients[clientID] = new Client({
				authStrategy: new LocalAuth({
					clientId: clientID
				})
			})
		
			clients[clientID].on("qr", qr => {
				socket.emit("qrcode", qr)
			})
		
			clients[clientID].on("ready", () => {
				socket.emit("client_ready")
			})
		 
			clients[clientID].initialize()
		});
	});
}

export async function getClientChats(req, res){
	try{
		const email = req.query.email;
		const clientID = email.split(alphaRegex).join("")

		clients[clientID].getChats().then((result) => {
			res.status(200).json({
				message: "Chats retrieved",
				data: {chats: result},
				code: "200-getClientChats"
			})
			cacheData(email+"-chats", result, 1200)
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
		const clientID = email.split(alphaRegex).join("")

		//If client disconnected for some reason
		if(!clients[clientID]){
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
				await clients[clientID].sendMessage(chatID, message, {sendSeen: false})
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

ScheduleController.eventEmitter.on("send_message", (info) => {
	sendScheduled(info.clientID, info.chatIDs, info.message, info.scheduleID, info.email)
})

export async function sendScheduled(clientID, chatIDs, message, scheduleID, email){
	try{
		if(!clients[clientID]){
			console.log("invalid client")
			ScheduleController.eventEmitter.emit("expire_schedule", {email, scheduleID})
			return
		}
		if(clients[clientID]){

			if(!clients[clientID].info){
				console.log("Invalid client session")
				return
			}
			for( const chatID of chatIDs){
				clients[clientID].sendMessage(chatID, message, {sendSeen: false}).then( result => {
					ScheduleController.eventEmitter.emit("message_sent", {scheduleID, email})
				})
			}
		}
	} catch(error) {
		console.log(error)
	}
}

export async function disconnectClient(req, res){
	try{
		const email = req.query.email;
		const clientID = email.split(alphaRegex).join("")
		if(clients[clientID]){
			console.log("ID is valid")
			if(clients[clientID].info){
				console.log("Client is running")
				clients[clientID].destroy().then(() => {
					res.status(200).json({
						message: "Client disconnected successfully",
						data: {},
						code: "200-disconnectClient"
					})
					clients[clientID] = undefined	//Set client to undefined to bypass initialization guard
				}).catch( error => console.log(error))
			}
		}
		deleteCachedData(email)
	} catch(error){
		console.log(error)
		res.status(500).json({
			message: "Something went wrong",
			data: {},
			code: "500-disconnectClient"
		})
	}	

}



// const testClient = new Client()
// testClient.destroy()