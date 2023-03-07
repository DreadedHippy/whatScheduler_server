//importing dependencies
import wweb from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
let innerSocket;

const {Client, LocalAuth} = wweb

let clients = {};

export function connectSocket(io){
	io.on('connection', (socket) => {
		//Connect client function
		socket.on("connect_client", (id) => {
			console.log("CLIENT_CONTROLLER: Angular frontend connected")
			const alphaRegex = /[^A-Za-z0-9]+/
			const clientID = id.split(alphaRegex).join("")

			if(!clientID){
				socket.emit("invalid_id")
				return
			}

			if(clients[clientID]){
				if(clients[clientID].info){					
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
				console.log(qr)
				socket.emit("qrcode", qr)
			})
		
			clients[clientID].on("ready", () => {
				console.log("Client ready")
				console.log("Client: ", clients[clientID])
				console.log("Client info: ", clients[clientID].info)
				socket.emit("client_ready")
			})
		
			clients[clientID].initialize()
			console.log("Client info: ", clients[clientID].info)
		});

		innerSocket = socket;
	});
}

export async function getClientChats(req, res){
	try{
		const email = req.query.email;
		const alphaRegex = /[^A-Za-z0-9]+/
		const clientID = email.split(alphaRegex).join("")

		clients[clientID].getChats().then((result) => {
			console.log(result[0]);
			res.status(200).json({
				message: "Chats retrieved",
				data: {chats: result},
				code: "200-getClientChats"
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

// const testClient = new Client()
// testClient.