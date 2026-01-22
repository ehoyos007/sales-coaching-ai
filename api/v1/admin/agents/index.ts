/**
 * Admin Agents Endpoint
 * GET /api/v1/admin/agents - List all sales agents
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  requireAdmin,
} from '../../../../lib/middleware/auth';
import { getSupabaseClient } from '../../../../lib/database';

export default createApiHandler({
  GET: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireAdmin(req.profile!);

      const supabase = getSupabaseClient();

      const { data: agents, error } = await supabase
        .from('agent_directory')
        .select(`
          *,
          team:teams(id, name)
        `)
        .order('agent_name', { ascending: true });

      if (error) {
        throw ApiException.internal(`Failed to fetch agents: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: {
          agents: agents || [],
          count: agents?.length || 0,
        },
      });
    }
  ),
});
