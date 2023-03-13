import express from 'express';
import * as ClientController from '../controllers/clientController.js';
import checkAuth from '../middleware/check-auth.js';
import { cachedChats } from '../middleware/redis-cache.js';

const router = express.Router();

router.get("/chats", checkAuth, cachedChats, ClientController.getClientChats);
router.post("/send", checkAuth, ClientController.sendMessage)
router.get("/disconnect", checkAuth, ClientController.disconnectClient)

export default router