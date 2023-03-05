//Module Imports
import http from 'http';
import { Server } from 'socket.io';

//File imports
import app, {eventEmitter} from './src/app.js';
import * as ClientController from './src/controllers/clientController.js'
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8100"],
    methods: ["GET", "POST", "PUT", "PATCH"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});
// const io = new Server(server, 
//   cors: {
//     origin: "https://example.com",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true
//   });
const PORT = process.env.PORT || 3000;

eventEmitter.on("db_connected", () => {
  server.listen(PORT, () => {
    console.log('listening on *:3000');
  });
})


io.on('connection', (socket) => {
  socket.on("connect_client", () => {
    console.log("Angular frontend connected")
  })
  console.log('a user connected');

  socket.on("disconnect", () => {
    console.log("A user disconnected")
  })
});

ClientController.connectSocket(io)



// eventEmitter.on('db_connected', () => {
// })