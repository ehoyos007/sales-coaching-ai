import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';

const router = Router();

// POST /api/v1/chat - Main chat endpoint
router.post('/', chatController.handleChat);

// GET /api/v1/chat/history/:sessionId - Get chat history for a session
router.get('/history/:sessionId', chatController.getHistory);

export default router;
