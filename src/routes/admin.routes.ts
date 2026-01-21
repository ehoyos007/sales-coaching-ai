// =============================================
// ADMIN ROUTES - Sales Coaching AI
// Admin-only endpoints for user and team management
// =============================================

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth/auth.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// =============================================
// GET /admin/users - List all users
// =============================================
router.get('/users', async (req: Request, res: Response) => {
  try {
    const profiles = await authService.getAllProfiles();

    console.log(`[admin.routes] Listed ${profiles.length} users (by ${req.user?.email})`);

    res.json({
      success: true,
      data: {
        users: profiles,
        count: profiles.length,
      },
    });
  } catch (error) {
    console.error('[admin.routes] List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
    });
  }
});

// =============================================
// PUT /admin/users/:userId/role - Change user role
// =============================================
router.put('/users/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['agent', 'manager'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "agent" or "manager"',
      });
      return;
    }

    const result = await authService.setUserRole(req.user!.id, userId, role);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    const updatedProfile = await authService.getUserProfile(userId);

    console.log(`[admin.routes] Role changed: user ${userId} -> ${role} (by ${req.user?.email})`);

    res.json({
      success: true,
      message: `Role updated to ${role}`,
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error('[admin.routes] Change role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change role',
    });
  }
});

// =============================================
// PUT /admin/users/:userId/team - Assign user to team
// =============================================
router.put('/users/:userId/team', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { teamId } = req.body;

    // teamId can be null to unassign from team
    if (teamId !== null && typeof teamId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'teamId must be a string or null',
      });
      return;
    }

    const result = await authService.assignUserToTeam(req.user!.id, userId, teamId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    const updatedProfile = await authService.getUserProfile(userId);

    console.log(`[admin.routes] Team assigned: user ${userId} -> team ${teamId || 'none'} (by ${req.user?.email})`);

    res.json({
      success: true,
      message: teamId ? 'User assigned to team' : 'User removed from team',
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error('[admin.routes] Assign team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign team',
    });
  }
});

// =============================================
// PUT /admin/users/:userId/agent - Link user to agent_user_id
// =============================================
router.put('/users/:userId/agent', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { agentUserId } = req.body;

    if (!agentUserId || typeof agentUserId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'agentUserId is required and must be a string',
      });
      return;
    }

    const updated = await authService.updateProfile(userId, { agent_user_id: agentUserId });

    if (!updated) {
      res.status(500).json({
        success: false,
        error: 'Failed to update agent link',
      });
      return;
    }

    console.log(`[admin.routes] Agent linked: user ${userId} -> agent ${agentUserId} (by ${req.user?.email})`);

    res.json({
      success: true,
      message: 'User linked to agent',
      data: { profile: updated },
    });
  } catch (error) {
    console.error('[admin.routes] Link agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link agent',
    });
  }
});

// =============================================
// GET /admin/teams - List all teams
// =============================================
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const teams = await authService.getAllTeams();

    console.log(`[admin.routes] Listed ${teams.length} teams (by ${req.user?.email})`);

    res.json({
      success: true,
      data: {
        teams,
        count: teams.length,
      },
    });
  } catch (error) {
    console.error('[admin.routes] List teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list teams',
    });
  }
});

// =============================================
// POST /admin/teams - Create a new team
// =============================================
router.post('/teams', async (req: Request, res: Response) => {
  try {
    const { name, description, manager_id } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Team name is required',
      });
      return;
    }

    const result = await authService.createTeam(req.user!.id, name, description, manager_id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    console.log(`[admin.routes] Team created: ${name} (by ${req.user?.email})`);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { team: result.team },
    });
  } catch (error) {
    console.error('[admin.routes] Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
});

// =============================================
// PUT /admin/teams/:teamId - Update a team
// =============================================
router.put('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { name, description, manager_id } = req.body;

    // At least one field must be provided
    if (name === undefined && description === undefined && manager_id === undefined) {
      res.status(400).json({
        success: false,
        error: 'At least one field (name, description, or manager_id) must be provided',
      });
      return;
    }

    const result = await authService.updateTeam(req.user!.id, teamId, { name, description, manager_id });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    console.log(`[admin.routes] Team updated: ${teamId} (by ${req.user?.email})`);

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: { team: result.team },
    });
  } catch (error) {
    console.error('[admin.routes] Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team',
    });
  }
});

// =============================================
// DELETE /admin/teams/:teamId - Delete a team
// =============================================
router.delete('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    const result = await authService.deleteTeam(req.user!.id, teamId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    console.log(`[admin.routes] Team deleted: ${teamId} (by ${req.user?.email})`);

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('[admin.routes] Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team',
    });
  }
});

// =============================================
// GET /admin/teams/:teamId/members - Get team members
// =============================================
router.get('/teams/:teamId/members', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const members = await authService.getTeamMembers(teamId);

    res.json({
      success: true,
      data: {
        members,
        count: members.length,
      },
    });
  } catch (error) {
    console.error('[admin.routes] Get team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team members',
    });
  }
});

export default router;
