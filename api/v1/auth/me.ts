/**
 * Get Current User Profile Endpoint
 * GET /api/v1/auth/me
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../../lib/api-handler';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

export default createApiHandler({
  GET: withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile: req.profile,
      },
    });
  }),
});
