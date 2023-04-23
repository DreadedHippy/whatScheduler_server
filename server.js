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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const PORT = process.env.PORT || 8080;

eventEmitter.on("db_connected", () => {
  server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
})


io.on('connection', (socket) => {
  socket.on("connect_client", () => {
    // console.log("Angular frontend connected") //Debug
  })
  console.log('a user connected');

  socket.on("disconnect", () => {
    console.log("A user disconnected")
  })
});

eventEmitter.on("mongostore_connected", (mongoStore) => {
  ClientController.connectSocket(io, mongoStore)
})


// eventEmitter.on('db_connected', () => {
// })