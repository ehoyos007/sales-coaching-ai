import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { teamService } from '../../database/team.service.js';
import { getDateRange } from '../../../utils/date.utils.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

export async function handleTeamSummary(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    // Calculate date range
    const { startDate, endDate } = params.startDate && params.endDate
      ? { startDate: params.startDate, endDate: params.endDate }
      : getDateRange(params.daysBack);

    // Default to "Agent" department if not specified
    const department = params.department || 'Agent';

    // Fetch team summary
    const summary = await teamService.getTeamSummary(
      department,
      startDate,
      endDate
    );

    if (!summary) {
      return {
        success: true,
        data: {
          type: 'team_summary',
          department,
          start_date: startDate,
          end_date: endDate,
          summary: null,
          message: ErrorMessages.noTeamData(department, startDate, endDate),
        },
      };
    }

    return {
      success: true,
      data: {
        type: 'team_summary',
        department,
        start_date: startDate,
        end_date: endDate,
        summary,
      },
    };
  } catch (error) {
    return formatError(buildErrorMessage(error, { operation: 'fetch team summary' }));
  }
}
