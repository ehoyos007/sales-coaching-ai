// =============================================
// DASHBOARD ROUTES - Team & Agent Overview API
// =============================================

import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import {
  authenticate,
  scopeDataAccess,
  requireManagerOrAdmin,
  canAccessAgent,
} from '../middleware/auth.middleware.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// =============================================
// TEAM OVERVIEW ROUTES
// =============================================

/**
 * GET /api/v1/dashboard/teams/:teamId/overview
 * Get team overview metrics
 * Requires: manager or admin role
 */
router.get(
  '/teams/:teamId/overview',
  requireManagerOrAdmin,
  dashboardController.getTeamOverview
);

// =============================================
// AGENT OVERVIEW ROUTES
// =============================================

/**
 * GET /api/v1/dashboard/agents/:agentId/overview
 * Get agent overview metrics
 * Requires: authenticated user with access to agent data
 */
router.get(
  '/agents/:agentId/overview',
  scopeDataAccess,
  canAccessAgent,
  dashboardController.getAgentOverview
);

// =============================================
// TREND ROUTES
// =============================================

/**
 * GET /api/v1/dashboard/trends/call-volume
 * Get call volume trend data
 * Requires: authenticated user
 */
router.get(
  '/trends/call-volume',
  scopeDataAccess,
  dashboardController.getCallVolumeTrend
);

// =============================================
// COMPLIANCE ROUTES
// =============================================

/**
 * GET /api/v1/dashboard/compliance/summary
 * Get compliance summary metrics
 * Requires: authenticated user
 */
router.get(
  '/compliance/summary',
  scopeDataAccess,
  dashboardController.getComplianceSummary
);

// =============================================
// GOALS ROUTES
// =============================================

/**
 * GET /api/v1/dashboard/goals/progress
 * Get goals progress
 * Requires: authenticated user
 */
router.get(
  '/goals/progress',
  scopeDataAccess,
  dashboardController.getGoalsProgress
);

/**
 * POST /api/v1/dashboard/goals
 * Create a new goal
 * Requires: manager or admin role
 */
router.post(
  '/goals',
  requireManagerOrAdmin,
  dashboardController.createGoal
);

/**
 * PUT /api/v1/dashboard/goals/:goalId
 * Update a goal
 * Requires: manager or admin role
 */
router.put(
  '/goals/:goalId',
  requireManagerOrAdmin,
  dashboardController.updateGoal
);

/**
 * DELETE /api/v1/dashboard/goals/:goalId
 * Delete a goal
 * Requires: manager or admin role
 */
router.delete(
  '/goals/:goalId',
  requireManagerOrAdmin,
  dashboardController.deleteGoal
);

export default router;
