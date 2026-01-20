import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';

const router = Router();

// POST /api/v1/chat - Main chat endpoint
router.post('/', chatController.handleChat);

export default router;
