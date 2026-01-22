/**
 * Chat History Endpoint
 * GET /api/v1/chat/history/:sessionId - Get chat history for a session
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import { sessionsService } from '../../../../lib/services/sessions.service';

export default createApiHandler({
  GET: withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { sessionId } = req.query as { sessionId: string };

    if (!sessionId) {
      throw ApiException.badRequest('Session ID is required');
    }

    const result = await sessionsService.getSessionWithMessages(sessionId);

    if (!result) {
      res.status(200).json({
        success: true,
        data: {
          session: null,
          messages: [],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        session: result.session,
        messages: result.messages,
      },
    });
  }),
});
