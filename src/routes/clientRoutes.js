import express from 'express';
import * as ClientController from '../controllers/clientController.js';

const router = express.Router();

router.post("/connect", ClientController.connectClient)

export default router