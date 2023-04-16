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
import clientRoutes from './routes/clientRoutes.js'
import scheduleRoutes from './routes/scheduleRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

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

// Mongoose connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_DB_URI).then(async () => {
    const store = new MongoStore({ mongoose: mongoose });
    eventEmitter.emit('mongostore_connected', store)
    console.log("Connected to MongoDB")
    eventEmitter.emit('db_connected')
});

let clients = {}

app.use("/api/auth", authRoutes)
app.use("/api/client", clientRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/tasks", taskRoutes)

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

export {app as default, eventEmitter};