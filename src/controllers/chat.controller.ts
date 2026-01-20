import { Request, Response } from 'express';
import { chatService } from '../services/chat/chat.service.js';
import { sessionsService } from '../services/database/sessions.service.js';
import { ChatRequest, UserContext, DataAccessScope } from '../types/index.js';

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

    // Build user context from auth middleware
    const userContext: UserContext | undefined = req.profile
      ? {
          userId: req.user!.id,
          email: req.user!.email,
          role: req.profile.role,
          teamId: req.profile.team_id,
          agentUserId: req.profile.agent_user_id,
        }
      : undefined;

    // Get data scope from auth middleware
    const dataScope: DataAccessScope | undefined = req.dataScope;

    const result = await chatService.processMessage(
      body.message,
      body.context,
      body.session_id,
      userContext,
      dataScope
    );

    res.json(result);
  } catch (error) {
    console.error('[chat.controller] Chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to process chat message: ${message}`,
    });
  }
}

/**
 * Get chat history for a session
 */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    const result = await sessionsService.getSessionWithMessages(sessionId);

    if (!result) {
      res.json({
        success: true,
        data: {
          session: null,
          messages: [],
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        session: result.session,
        messages: result.messages,
      },
    });
  } catch (error) {
    console.error('[chat.controller] Get history error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get chat history: ${message}`,
    });
  }
}

export const chatController = {
  handleChat,
  getHistory,
};
