import express from 'express';
import { getResponseFromChatbot } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/chatbot', getResponseFromChatbot);

export default router;