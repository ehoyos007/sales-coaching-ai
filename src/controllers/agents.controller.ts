import { Request, Response } from 'express';
import { agentsService } from '../services/database/agents.service.js';
import { callsService } from '../services/database/calls.service.js';
import { getDateRange, isValidDate } from '../utils/date.utils.js';

export async function listAgents(_req: Request, res: Response): Promise<void> {
  try {
    const agents = await agentsService.listAgents();

    res.json({
      success: true,
      data: {
        agents,
        count: agents.length,
      },
    });
  } catch (error) {
    console.error('List agents error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to list agents: ${message}`,
    });
  }
}

export async function getAgent(req: Request, res: Response): Promise<void> {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
      return;
    }

    const agent = await agentsService.getAgentById(agentId);

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
      return;
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Get agent error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get agent: ${message}`,
    });
  }
}

export async function getAgentCalls(req: Request, res: Response): Promise<void> {
  try {
    const { agentId } = req.params;
    const { start_date, end_date, limit } = req.query;

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
      return;
    }

    // Validate and parse date range
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
      const range = getDateRange(7);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;

    const calls = await callsService.getAgentCalls(agentId, startDate, endDate, parsedLimit);

    res.json({
      success: true,
      data: {
        agent_user_id: agentId,
        start_date: startDate,
        end_date: endDate,
        calls,
        count: calls.length,
      },
    });
  } catch (error) {
    console.error('Get agent calls error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get agent calls: ${message}`,
    });
  }
}

export async function getAgentPerformance(req: Request, res: Response): Promise<void> {
  try {
    const { agentId } = req.params;
    const { start_date, end_date } = req.query;

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
      return;
    }

    // Validate and parse date range
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
      const range = getDateRange(7);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const performance = await callsService.getAgentPerformance(agentId, startDate, endDate);

    res.json({
      success: true,
      data: {
        agent_user_id: agentId,
        start_date: startDate,
        end_date: endDate,
        performance,
      },
    });
  } catch (error) {
    console.error('Get agent performance error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get agent performance: ${message}`,
    });
  }
}

export const agentsController = {
  listAgents,
  getAgent,
  getAgentCalls,
  getAgentPerformance,
};
