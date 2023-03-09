import express from 'express';
import * as ClientController from '../controllers/clientController.js';
import checkAuth from '../middleware/check-auth.js';

const router = express.Router();

router.get("/chats", checkAuth, ClientController.getClientChats);
router.post("/send", checkAuth, ClientController.sendMessage)

export default router