/**
 * Admin Agent Team Endpoint
 * PUT /api/v1/admin/agents/:agentUserId/team - Update sales agent team assignment
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  requireAdmin,
} from '../../../../../lib/middleware/auth';
import { getSupabaseClient } from '../../../../../lib/database';

export default createApiHandler({
  PUT: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireAdmin(req.profile!);

      const { agentUserId } = req.query as { agentUserId: string };
      const { teamId } = req.body as { teamId: string | null };

      if (!agentUserId) {
        throw ApiException.badRequest('Agent User ID is required');
      }

      const supabase = getSupabaseClient();

      // Verify team exists if teamId is provided
      if (teamId) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('id', teamId)
          .single();

        if (teamError || !team) {
          throw ApiException.badRequest('Invalid team ID');
        }
      }

      const { data: agent, error } = await supabase
        .from('agent_directory')
        .update({ team_id: teamId })
        .eq('agent_user_id', agentUserId)
        .select()
        .single();

      if (error) {
        throw ApiException.internal(`Failed to update agent team: ${error.message}`);
      }

      if (!agent) {
        throw ApiException.notFound('Agent not found');
      }

      res.status(200).json({
        success: true,
        data: {
          agent,
        },
      });
    }
  ),
});
