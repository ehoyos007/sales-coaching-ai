/**
 * Admin Users Endpoint
 * GET /api/v1/admin/users - List all users
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

      const { data: users, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          team:teams(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw ApiException.internal(`Failed to fetch users: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: {
          users: users || [],
          count: users?.length || 0,
        },
      });
    }
  ),
});
