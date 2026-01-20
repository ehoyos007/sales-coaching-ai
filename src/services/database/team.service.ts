import { getSupabaseClient } from '../../config/database.js';
import { TeamSummary } from '../../types/index.js';

/**
 * Get team-wide performance summary
 * Calls the get_team_summary PostgreSQL function
 */
export async function getTeamSummary(
  department: string | null,
  startDate: string,
  endDate: string
): Promise<TeamSummary | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_team_summary', {
      p_department: department,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) {
    throw new Error(`Failed to get team summary: ${error.message}`);
  }

  // Function returns array, take first result
  if (data && data.length > 0) {
    return data[0];
  }

  return null;
}

/**
 * Get summary for all departments
 */
export async function getAllDepartmentsSummary(
  startDate: string,
  endDate: string
): Promise<TeamSummary[]> {
  // Get summary for both main departments
  const departments = ['Agent', 'CS Dept'];
  const summaries: TeamSummary[] = [];

  for (const dept of departments) {
    const summary = await getTeamSummary(dept, startDate, endDate);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
}

export const teamService = {
  getTeamSummary,
  getAllDepartmentsSummary,
};
