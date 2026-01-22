/**
 * Admin User Team Endpoint
 * PUT /api/v1/admin/users/:userId/team - Update user team assignment
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

      const { userId } = req.query as { userId: string };
      const { team_id } = req.body as { team_id: string | null };

      if (!userId) {
        throw ApiException.badRequest('User ID is required');
      }

      const supabase = getSupabaseClient();

      // Verify team exists if team_id is provided
      if (team_id) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('id', team_id)
          .single();

        if (teamError || !team) {
          throw ApiException.badRequest('Invalid team ID');
        }
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({ team_id })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw ApiException.internal(`Failed to update user team: ${error.message}`);
      }

      if (!profile) {
        throw ApiException.notFound('User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          profile,
        },
      });
    }
  ),
});
