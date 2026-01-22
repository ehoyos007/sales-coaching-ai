/**
 * User Signup Endpoint
 * POST /api/v1/auth/signup
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../lib/api-handler';
import { authService } from '../../../lib/services/auth.service';

export default createApiHandler({
  POST: async (req: VercelRequest, res: VercelResponse) => {
    const { email, password, fullName } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    if (!email || !password) {
      throw ApiException.badRequest('Email and password are required');
    }

    const result = await authService.signUp(email, password, fullName);

    if (!result.success) {
      throw ApiException.badRequest(result.error || 'Signup failed');
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
            }
          : null,
      },
      message: 'Account created successfully',
    });
  },
});
