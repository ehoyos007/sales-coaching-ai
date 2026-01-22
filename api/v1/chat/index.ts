/**
 * Chat Endpoint
 * POST /api/v1/chat - Process a chat message
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
} from '../../../lib/middleware/auth';
import { chatService } from '../../../lib/services/chat.service';
import type { DataAccessScope } from '../../../lib/services/auth.service';

interface ChatRequest {
  message: string;
  context?: {
    agent_user_id?: string;
    call_id?: string;
    department?: string;
  };
  session_id?: string;
}

export default createApiHandler({
  POST: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const body = req.body as ChatRequest;

      if (!body.message || typeof body.message !== 'string') {
        throw ApiException.badRequest('Message is required and must be a string');
      }

      // Build user context from auth middleware
      const userContext = req.profile
        ? {
            userId: req.user!.id,
            email: req.user!.email,
            role: req.profile.role,
            teamId: req.profile.team_id,
            agentUserId: req.profile.agent_user_id,
          }
        : undefined;

      // Get data scope from auth middleware
      const dataScope = req.dataScope as DataAccessScope | undefined;

      const result = await chatService.processMessage(
        body.message,
        body.context,
        body.session_id,
        userContext,
        dataScope
      );

      res.status(200).json(result);
    }
  ),
});

// Configure longer timeout for chat processing
export const config = {
  maxDuration: 60, // 60 seconds (Vercel Pro)
};
