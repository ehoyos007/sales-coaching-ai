/**
 * User Signout Endpoint
 * POST /api/v1/auth/signout
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../../lib/api-handler';
import { authService } from '../../../lib/services/auth.service';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

export default createApiHandler({
  POST: withAuth(async (_req: AuthenticatedRequest, res: VercelResponse) => {
    await authService.signOut();

    res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });
  }),
});
