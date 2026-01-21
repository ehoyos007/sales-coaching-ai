// =============================================
// DASHBOARD CONTROLLER - Team & Agent Overview API
// =============================================

import { Request, Response } from 'express';
import { dashboardService } from '../services/database/dashboard.service.js';
import { complianceService } from '../services/database/compliance.service.js';
import { goalsService } from '../services/database/goals.service.js';
import { getDateRange, isValidDate } from '../utils/date.utils.js';

// =============================================
// GET TEAM OVERVIEW
// =============================================

/**
 * GET /api/v1/dashboard/teams/:teamId/overview
 * Get aggregated metrics for a team
 */
export async function getTeamOverview(req: Request, res: Response): Promise<void> {
  try {
    const { teamId } = req.params;
    const { start_date, end_date } = req.query;

    // Validate team ID
    if (!teamId) {
      res.status(400).json({
        success: false,
        error: 'Team ID is required',
      });
      return;
    }

    // Parse date range (default to current month)
    let startDate: string;
    let endDate: string;

    if (start_date && end_date) {
      if (!isValidDate(start_date as string) || !isValidDate(end_date as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      startDate = start_date as string;
      endDate = end_date as string;
    } else {
      // Default to current month
      const now = new Date();
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    // Fetch team overview metrics
    const overview = await dashboardService.getTeamOverviewMetrics(teamId, startDate, endDate);

    if (!overview) {
      res.json({
        success: true,
        data: null,
        message: 'No data found for this team in the specified date range.',
      });
      return;
    }

    // Fetch additional data: objections and goals
    const [objections, goals] = await Promise.all([
      dashboardService.getObjectionSummary(undefined, teamId, startDate, endDate),
      goalsService.getGoalsProgress(undefined, teamId, startDate, endDate),
    ]);

    res.json({
      success: true,
      data: {
        ...overview,
        objections,
        goals,
      },
    });
  } catch (error) {
    console.error('[dashboard.controller] Get team overview error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get team overview: ${message}`,
    });
  }
}

// =============================================
// GET AGENT OVERVIEW
// =============================================

/**
 * GET /api/v1/dashboard/agents/:agentId/overview
 * Get individual agent metrics
 */
export async function getAgentOverview(req: Request, res: Response): Promise<void> {
  try {
    const { agentId } = req.params;
    const { start_date, end_date } = req.query;

    // Validate agent ID
    if (!agentId) {
      res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
      return;
    }

    // Parse date range (default to current month)
    let startDate: string;
    let endDate: string;

    if (start_date && end_date) {
      if (!isValidDate(start_date as string) || !isValidDate(end_date as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      startDate = start_date as string;
      endDate = end_date as string;
    } else {
      // Default to current month
      const now = new Date();
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    // Fetch agent overview metrics
    const overview = await dashboardService.getAgentOverviewMetrics(agentId, startDate, endDate);

    if (!overview) {
      res.json({
        success: true,
        data: null,
        message: 'No data found for this agent in the specified date range.',
      });
      return;
    }

    // Fetch additional data: objections and goals
    const [objections, goals] = await Promise.all([
      dashboardService.getObjectionSummary(agentId, undefined, startDate, endDate),
      goalsService.getGoalsProgress(agentId, undefined, startDate, endDate),
    ]);

    res.json({
      success: true,
      data: {
        ...overview,
        objections,
        goals,
      },
    });
  } catch (error) {
    console.error('[dashboard.controller] Get agent overview error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get agent overview: ${message}`,
    });
  }
}

// =============================================
// GET CALL VOLUME TREND
// =============================================

/**
 * GET /api/v1/dashboard/trends/call-volume
 * Get call volume trend data for charts
 */
export async function getCallVolumeTrend(req: Request, res: Response): Promise<void> {
  try {
    const { agent_id, team_id, start_date, end_date } = req.query;

    // Parse date range (default to last 30 days)
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (start_date && end_date) {
      if (!isValidDate(start_date as string) || !isValidDate(end_date as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      startDate = start_date as string;
      endDate = end_date as string;
    } else {
      const range = getDateRange(30);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const trend = await dashboardService.getCallVolumeTrend(
      agent_id as string | undefined,
      team_id as string | undefined,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error('[dashboard.controller] Get call volume trend error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get call volume trend: ${message}`,
    });
  }
}

// =============================================
// GET COMPLIANCE SUMMARY
// =============================================

/**
 * GET /api/v1/dashboard/compliance/summary
 * Get compliance metrics summary
 */
export async function getComplianceSummary(req: Request, res: Response): Promise<void> {
  try {
    const { agent_id, team_id, start_date, end_date } = req.query;

    // Parse date range (default to current month)
    let startDate: string;
    let endDate: string;

    if (start_date && end_date) {
      if (!isValidDate(start_date as string) || !isValidDate(end_date as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      startDate = start_date as string;
      endDate = end_date as string;
    } else {
      const now = new Date();
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    let summary;
    if (agent_id) {
      summary = await complianceService.getAgentComplianceSummary(agent_id as string, startDate, endDate);
    } else if (team_id) {
      summary = await complianceService.getTeamComplianceAggregates(team_id as string, startDate, endDate);
    } else {
      res.status(400).json({
        success: false,
        error: 'Either agent_id or team_id is required',
      });
      return;
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[dashboard.controller] Get compliance summary error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get compliance summary: ${message}`,
    });
  }
}

// =============================================
// GET GOALS PROGRESS
// =============================================

/**
 * GET /api/v1/dashboard/goals/progress
 * Get goals progress
 */
export async function getGoalsProgress(req: Request, res: Response): Promise<void> {
  try {
    const { agent_id, team_id, start_date, end_date } = req.query;

    const progress = await goalsService.getGoalsProgress(
      agent_id as string | undefined,
      team_id as string | undefined,
      start_date as string | undefined,
      end_date as string | undefined
    );

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('[dashboard.controller] Get goals progress error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get goals progress: ${message}`,
    });
  }
}

// =============================================
// CREATE GOAL
// =============================================

/**
 * POST /api/v1/dashboard/goals
 * Create a new goal
 */
export async function createGoal(req: Request, res: Response): Promise<void> {
  try {
    const { agent_user_id, team_id, goal_type, target_value, period_start, period_end } = req.body;

    // Validate required fields
    if (!goal_type || target_value === undefined || !period_start || !period_end) {
      res.status(400).json({
        success: false,
        error: 'goal_type, target_value, period_start, and period_end are required',
      });
      return;
    }

    // Validate goal type
    const validGoalTypes = ['calls', 'duration', 'compliance_score', 'objection_resolution'];
    if (!validGoalTypes.includes(goal_type)) {
      res.status(400).json({
        success: false,
        error: `Invalid goal_type. Must be one of: ${validGoalTypes.join(', ')}`,
      });
      return;
    }

    // Validate that either agent_user_id or team_id is provided
    if (!agent_user_id && !team_id) {
      res.status(400).json({
        success: false,
        error: 'Either agent_user_id or team_id is required',
      });
      return;
    }

    const goal = await goalsService.createGoal({
      agentUserId: agent_user_id,
      teamId: team_id,
      goalType: goal_type,
      targetValue: target_value,
      periodStart: period_start,
      periodEnd: period_end,
    }, req.user?.id);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('[dashboard.controller] Create goal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to create goal: ${message}`,
    });
  }
}

// =============================================
// UPDATE GOAL
// =============================================

/**
 * PUT /api/v1/dashboard/goals/:goalId
 * Update a goal
 */
export async function updateGoal(req: Request, res: Response): Promise<void> {
  try {
    const { goalId } = req.params;
    const { target_value, actual_value, is_active } = req.body;

    if (!goalId) {
      res.status(400).json({
        success: false,
        error: 'Goal ID is required',
      });
      return;
    }

    const goal = await goalsService.updateGoal(goalId, {
      targetValue: target_value,
      actualValue: actual_value,
      isActive: is_active,
    });

    res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('[dashboard.controller] Update goal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to update goal: ${message}`,
    });
  }
}

// =============================================
// DELETE GOAL
// =============================================

/**
 * DELETE /api/v1/dashboard/goals/:goalId
 * Delete a goal
 */
export async function deleteGoal(req: Request, res: Response): Promise<void> {
  try {
    const { goalId } = req.params;

    if (!goalId) {
      res.status(400).json({
        success: false,
        error: 'Goal ID is required',
      });
      return;
    }

    await goalsService.deleteGoal(goalId);

    res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('[dashboard.controller] Delete goal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to delete goal: ${message}`,
    });
  }
}

// =============================================
// EXPORT CONTROLLER
// =============================================

export const dashboardController = {
  getTeamOverview,
  getAgentOverview,
  getCallVolumeTrend,
  getComplianceSummary,
  getGoalsProgress,
  createGoal,
  updateGoal,
  deleteGoal,
};
