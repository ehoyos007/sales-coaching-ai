/**
 * Admin Team By ID Endpoint
 * GET /api/v1/admin/teams/:teamId - Get team details
 * PUT /api/v1/admin/teams/:teamId - Update team
 * DELETE /api/v1/admin/teams/:teamId - Delete team
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  requireManagerOrAdmin,
} from '../../../../lib/middleware/auth';
import { getSupabaseClient } from '../../../../lib/database';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireManagerOrAdmin(req.profile!);

      const { teamId } = req.query as { teamId: string };

      if (!teamId) {
        throw ApiException.badRequest('Team ID is required');
      }

      const supabase = getSupabaseClient();

      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error || !team) {
        throw ApiException.notFound('Team not found');
      }

      res.status(200).json({
        success: true,
        data: {
          team,
        },
      });
    }
  ),

  PUT: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireManagerOrAdmin(req.profile!);

      const { teamId } = req.query as { teamId: string };
      const { name, description, manager_id } = req.body as {
        name?: string;
        description?: string;
        manager_id?: string | null;
      };

      if (!teamId) {
        throw ApiException.badRequest('Team ID is required');
      }

      const supabase = getSupabaseClient();

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (manager_id !== undefined) updates.manager_id = manager_id;

      if (Object.keys(updates).length === 0) {
        throw ApiException.badRequest('No updates provided');
      }

      const { data: team, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) {
        throw ApiException.internal(`Failed to update team: ${error.message}`);
      }

      if (!team) {
        throw ApiException.notFound('Team not found');
      }

      res.status(200).json({
        success: true,
        data: {
          team,
        },
      });
    }
  ),

  DELETE: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireManagerOrAdmin(req.profile!);

      const { teamId } = req.query as { teamId: string };

      if (!teamId) {
        throw ApiException.badRequest('Team ID is required');
      }

      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        throw ApiException.internal(`Failed to delete team: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
      });
    }
  ),
});
