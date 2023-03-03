// import http from 'http';
// import app, {eventEmitter} from './src/app.js';
// import { Server } from 'socket.io';
// const server = http.createServer(app);
// const io = new Server(server);
// const PORT = process.env.PORT || 3000;


// io.on('connection', (socket) => {
// 	console.log('a user connected');
// });

// server.listen(PORT)
// console.log(`Server running on port ${PORT}`)
import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
import { Server } from 'socket.io'
const io = new Server(server);

app.get('/', (req, res) => {
	res.send("Success");
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

// eventEmitter.on('db_connected', () => {
// })