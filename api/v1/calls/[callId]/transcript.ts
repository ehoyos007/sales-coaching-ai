/**
 * Call Transcript Endpoint
 * GET /api/v1/calls/:callId/transcript - Get call transcript
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  canAccessAgent,
} from '../../../../lib/middleware/auth';
import { callsService } from '../../../../lib/services/calls.service';
import { transcriptsService } from '../../../../lib/services/transcripts.service';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const { callId } = req.query as { callId: string };

      if (!callId) {
        throw ApiException.badRequest('Call ID is required');
      }

      // First get the call to check access
      const call = await callsService.getCallById(callId);

      if (!call) {
        throw ApiException.notFound('Call not found');
      }

      // Check access based on agent_user_id of the call
      if (call.agent_user_id) {
        canAccessAgent(req.profile!, req.dataScope!, call.agent_user_id);
      }

      // Get the transcript
      const transcript = await transcriptsService.getFormattedTranscript(callId);

      if (!transcript) {
        throw ApiException.notFound('Transcript not found');
      }

      res.status(200).json({
        success: true,
        data: {
          call_id: callId,
          call_metadata: call,
          transcript: transcript,
        },
      });
    }
  ),
});
