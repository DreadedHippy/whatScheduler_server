//importing dependencies
import wweb from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';

const {Client, LocalAuth} = wweb

let clients = {};

export async function connectClient(clientID){
	clients[clientID]

	if(clients[clientID]){
		client.initialize();
	}

	clients[clientID] = new Client({
		authStrategy: new LocalAuth({
			clientId: clientID
		})
	})

	clients[clientID].on("qr", qr => {
		console.log(qr)
	})

	clients[clientID].on("ready", () => {
		console.log(ready)
	})
}