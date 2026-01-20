// =============================================
// AUTH ROUTES - Sales Coaching AI
// =============================================

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// =============================================
// POST /auth/signup - Register a new user
// =============================================
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    console.log(`[auth.routes] Signup attempt: ${email}`);

    const result = await authService.signUp(email, password, fullName);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    console.log(`[auth.routes] Signup successful: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
      data: {
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[auth.routes] Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
    });
  }
});

// =============================================
// POST /auth/signin - Sign in
// =============================================
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    console.log(`[auth.routes] Signin attempt: ${email}`);

    const result = await authService.signIn(email, password);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
      });
      return;
    }

    console.log(`[auth.routes] Signin successful: ${email} (role: ${result.profile?.role})`);

    res.json({
      success: true,
      data: {
        user: {
          id: result.user!.id,
          email: result.user!.email,
        },
        profile: result.profile,
        session: {
          access_token: result.session!.access_token,
          refresh_token: result.session!.refresh_token,
          expires_at: result.session!.expires_at,
        },
      },
    });
  } catch (error) {
    console.error('[auth.routes] Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign in',
    });
  }
});

// =============================================
// POST /auth/signout - Sign out
// =============================================
router.post('/signout', authenticate, async (req: Request, res: Response) => {
  try {
    console.log(`[auth.routes] Signout: ${req.user?.email}`);

    await authService.signOut();

    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('[auth.routes] Signout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign out',
    });
  }
});

// =============================================
// GET /auth/me - Get current user profile
// =============================================
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
        profile: req.profile,
      },
    });
  } catch (error) {
    console.error('[auth.routes] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

// =============================================
// PUT /auth/profile - Update current user profile
// =============================================
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { fullName, agentUserId } = req.body;

    const updates: { full_name?: string; agent_user_id?: string } = {};
    if (fullName) updates.full_name = fullName;
    if (agentUserId) updates.agent_user_id = agentUserId;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
      return;
    }

    const updated = await authService.updateProfile(req.user!.id, updates);

    if (!updated) {
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
      return;
    }

    console.log(`[auth.routes] Profile updated: ${req.user?.email}`);

    res.json({
      success: true,
      data: { profile: updated },
    });
  } catch (error) {
    console.error('[auth.routes] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

export default router;
