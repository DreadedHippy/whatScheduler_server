//importing dependencies
import wweb from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
let innerSocket;

const {Client, LocalAuth} = wweb

let clients = {};

export async function connectClient(req, res){
	const alphaRegex = /[^A-Za-z0-9]+/
	const clientID = req.query.clientID.split(alphaRegex).join("")

	if(!clientID){
		res.status(400).json({
			message: "No client id found",
			data: {connected: false},
			code: "400-connectClient"
		})
		return
	}

	clients[clientID] = new Client({
		authStrategy: new LocalAuth({
			clientId: clientID
		})
	})

	clients[clientID].on("qr", qr => {
		console.log(qr)
		innerSocket.emit("qrcode", qr)
	})

	clients[clientID].on("ready", () => {
		console.log(ready)
		res.status(200).json({
			message: "Client ready",
			data: {},
			code: "200-connectClient"
		})
	})

	clients[clientID].initialize()
}

export function connectSocket(io){
	io.on('connection', (socket) => {
		innerSocket = socket;
		innerSocket.on("connect_client", () => {
			console.log("CLIENT_CONTROLLER: Angular frontend connected")
		});
		innerSocket.emit("qrcode", "TEST")
	});
}