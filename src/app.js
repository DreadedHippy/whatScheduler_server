import fs from 'fs';
import wweb from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import wwebjs_mongo from 'wwebjs-mongo'
import EventEmitter from 'events';
import cors from 'cors';
import bodyParser from 'body-parser';

//File imports
import authRoutes from './routes/authRoutes.js'

//Necessary initializations
dotenv.config();
const { Client, RemoteAuth, LocalAuth } = wweb;
const { MongoStore } = wwebjs_mongo
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eventEmitter = new EventEmitter();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

//Mongoose connection
// mongoose.set('strictQuery', false);
// mongoose.connect(process.env.MONGO_DB_URI).then(async () => {
//     console.log("connected")
//     eventEmitter.emit('db_connected')
// });

let clients = {}

app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
})


async function storeSession(req, res){
    console.log("Pinged")
    let id = req.query.id

    if(!clients[id]){
        clients[id] = new Client({
            authStrategy: new LocalAuth({
                clientId: `client_${id}`
            })
        });
    }

    clients[id].on("qr", qr => {
        qrcode.generate(qr, {small: true})
    })

    clients[id].on("remote_session_saved", () => {        
        res.status(200).json({
            message: "Session saved"
        })
    })

    clients[id].on("ready", () => {
        console.log("Client Ready!")
    })

    clients[id].initialize();

    console.log(clients)
}

export {app as default, eventEmitter};