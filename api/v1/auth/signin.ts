/**
 * User Signin Endpoint
 * POST /api/v1/auth/signin
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../lib/api-handler';
import { authService } from '../../../lib/services/auth.service';

export default createApiHandler({
  POST: async (req: VercelRequest, res: VercelResponse) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      throw ApiException.badRequest('Email and password are required');
    }

    const result = await authService.signIn(email, password);

    if (!result.success) {
      throw ApiException.unauthorized(result.error || 'Sign in failed');
    }

    res.status(200).json({
      success: true,
      data: {
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
            }
          : null,
        profile: result.profile,
        session: result.session
          ? {
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token,
              expires_at: result.session.expires_at,
            }
          : null,
      },
    });
  },
});
