import { Request, Response } from 'express';
import { chatService } from '../services/chat/chat.service.js';
import { ChatRequest } from '../types/index.js';

export async function handleChat(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as ChatRequest;

    if (!body.message || typeof body.message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
      return;
    }

    const result = await chatService.processMessage(body.message, body.context);

    res.json(result);
  } catch (error) {
    console.error('Chat controller error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to process chat message: ${message}`,
    });
  }
}

export const chatController = {
  handleChat,
};
