/**
 * Admin User Role Endpoint
 * PUT /api/v1/admin/users/:userId/role - Update user role
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
  requireAdmin,
} from '../../../../../lib/middleware/auth';
import { getSupabaseClient } from '../../../../../lib/database';

const VALID_ROLES = ['admin', 'manager', 'agent'];

export default createApiHandler({
  PUT: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      requireAdmin(req.profile!);

      const { userId } = req.query as { userId: string };
      const { role } = req.body as { role: string };

      if (!userId) {
        throw ApiException.badRequest('User ID is required');
      }

      if (!role || !VALID_ROLES.includes(role)) {
        throw ApiException.badRequest(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      }

      const supabase = getSupabaseClient();

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw ApiException.internal(`Failed to update user role: ${error.message}`);
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
