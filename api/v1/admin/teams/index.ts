/**
 * Admin Teams Endpoint
 * GET /api/v1/admin/teams - List all teams
 * POST /api/v1/admin/teams - Create a new team
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

      const supabase = getSupabaseClient();

      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw ApiException.internal(`Failed to fetch teams: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: {
          teams: teams || [],
          count: teams?.length || 0,
        },
      });
    }
  ),

  POST: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireManagerOrAdmin(req.profile!);

      const { name, description, manager_id } = req.body as {
        name: string;
        description?: string;
        manager_id?: string;
      };

      if (!name || typeof name !== 'string') {
        throw ApiException.badRequest('Team name is required');
      }

      const supabase = getSupabaseClient();

      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name,
          description: description || null,
          manager_id: manager_id || null,
        })
        .select()
        .single();

      if (error) {
        throw ApiException.internal(`Failed to create team: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        data: {
          team,
        },
      });
    }
  ),
});
