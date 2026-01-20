import { Request, Response } from 'express';
import { teamService } from '../services/database/team.service.js';
import { getDateRange, isValidDate } from '../utils/date.utils.js';

export async function getTeamSummary(req: Request, res: Response): Promise<void> {
  try {
    const { department, start_date, end_date } = req.query;

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

    // Default to "Agent" department if not specified
    const dept = (department as string) || 'Agent';

    const summary = await teamService.getTeamSummary(dept, startDate, endDate);

    if (!summary) {
      res.json({
        success: true,
        data: {
          department: dept,
          start_date: startDate,
          end_date: endDate,
          summary: null,
          message: `No data found for the ${dept} department in the specified date range.`,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        department: dept,
        start_date: startDate,
        end_date: endDate,
        summary,
      },
    });
  } catch (error) {
    console.error('Get team summary error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get team summary: ${message}`,
    });
  }
}

export const teamController = {
  getTeamSummary,
};
