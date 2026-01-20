import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate, scopeDataAccess } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/chat - Main chat endpoint (protected with data scoping)
router.post('/', authenticate, scopeDataAccess, chatController.handleChat);

// GET /api/v1/chat/history/:sessionId - Get chat history for a session
router.get('/history/:sessionId', authenticate, chatController.getHistory);

export default router;
