/**
 * Update User Profile Endpoint
 * PUT /api/v1/auth/profile
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../lib/api-handler';
import { authService } from '../../../lib/services/auth.service';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

export default createApiHandler({
  PUT: withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    const { full_name, agent_user_id } = req.body as {
      full_name?: string;
      agent_user_id?: string;
    };

    if (!full_name && !agent_user_id) {
      throw ApiException.badRequest('At least one field to update is required');
    }

    const updates: { full_name?: string; agent_user_id?: string } = {};
    if (full_name) updates.full_name = full_name;
    if (agent_user_id) updates.agent_user_id = agent_user_id;

    const updatedProfile = await authService.updateProfile(req.user!.id, updates);

    if (!updatedProfile) {
      throw ApiException.internal('Failed to update profile');
    }

    res.status(200).json({
      success: true,
      profile: updatedProfile,
    });
  }),
});
