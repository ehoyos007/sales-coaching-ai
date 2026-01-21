import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { transcriptsService } from '../../database/transcripts.service.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { rubricService } from '../../database/rubric.service.js';
import { claudeService } from '../../ai/claude.service.js';
import { getDateRange } from '../../../utils/date.utils.js';
import {
  COACHING_SYSTEM_PROMPT,
  buildCoachingAnalysisPrompt,
  buildCoachingSummaryPrompt,
  CoachingVariables,
} from '../../../prompts/coaching-analysis.js';
import {
  buildDynamicSystemPrompt,
  buildDynamicCoachingPrompt,
  buildDynamicSummaryPrompt,
} from '../../../prompts/coaching-prompt-builder.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

/**
 * Coaching analysis result from Claude
 */
export interface CoachingAnalysis {
  scores: {
    opening_rapport: number;
    needs_discovery: number;
    product_presentation: number;
    objection_handling: number;
    compliance_disclosures: number;
    closing_enrollment: number;
  };
  overall_score: number;
  performance_level: string;
  strengths: string[];
  improvements: string[];
  action_items: string[];
  red_flags: {
    critical: string[];
    high: string[];
    medium: string[];
  };
  notable_moments: Array<{
    type: 'positive' | 'needs_work';
    category: string;
    description: string;
    quote?: string;
  }>;
}

/**
 * Handle aggregate coaching - provide coaching recommendations based on recent calls
 */
async function handleAggregateCoaching(params: HandlerParams): Promise<HandlerResult> {
  console.log('[coaching.handler] Generating aggregate coaching recommendations...');

  // Get date range for recent calls
  const { startDate, endDate } = getDateRange(params.daysBack || 7);

  // Fetch recent calls
  const recentCalls = await callsService.getRecentCalls(startDate, endDate, 10);

  if (recentCalls.length === 0) {
    return {
      success: true,
      data: {
        type: 'aggregate_coaching',
        start_date: startDate,
        end_date: endDate,
        call_count: 0,
        summary: 'No calls found in the selected time period. Try expanding the date range to get coaching recommendations.',
        recommendations: [],
      },
    };
  }

  // Gather call summaries with available metrics
  const callSummaries: string[] = [];
  for (const call of recentCalls) {
    const agentId = call.agent_user_id;
    const agent = agentId ? await agentsService.getAgentById(agentId) : null;
    const agentName = agent?.first_name || 'Unknown';
    const durationSeconds = call.total_duration_seconds || call.duration_seconds || 0;
    const durationMins = Math.round(durationSeconds / 60);
    const talkRatio = call.agent_talk_percentage
      ? `Agent ${call.agent_talk_percentage}% / Customer ${call.customer_talk_percentage}%`
      : 'N/A';

    callSummaries.push(
      `- ${agentName}: ${call.call_date}, ${durationMins} min, Talk ratio: ${talkRatio}`
    );
  }

  // Generate aggregate coaching tips using Claude
  const systemPrompt = `You are a sales coaching expert at First Health Enrollment.
Analyze call patterns and provide actionable coaching recommendations for the team.
Focus on practical, specific tips that can improve call performance.`;

  const analysisPrompt = `Based on ${recentCalls.length} recent calls from ${startDate} to ${endDate}, provide coaching recommendations.

Call summaries:
${callSummaries.join('\n')}

Provide 3-5 actionable coaching tips that would help improve team performance. Consider:
- Talk time ratios (ideal is around 40% agent, 60% customer)
- Call duration patterns
- Common improvement areas in sales calls

Respond with a JSON object:
{
  "team_insights": "A 2-3 sentence summary of observed patterns",
  "recommendations": [
    {
      "title": "Short title for the tip",
      "description": "Detailed explanation and how to implement",
      "priority": "high" | "medium" | "low"
    }
  ],
  "focus_area": "The single most important area to focus on"
}`;

  console.log('[coaching.handler] Generating aggregate coaching insights...');

  const insights = await claudeService.chatJSON<{
    team_insights: string;
    recommendations: Array<{
      title: string;
      description: string;
      priority: string;
    }>;
    focus_area: string;
  }>(systemPrompt, analysisPrompt, { maxTokens: 2048 });

  // Generate human-friendly summary
  const summaryPrompt = `Based on these coaching insights, write a brief, encouraging summary for managers:

Team Insights: ${insights.team_insights}
Focus Area: ${insights.focus_area}

Key Recommendations:
${insights.recommendations.map(r => `- ${r.title}: ${r.description}`).join('\n')}

Write 2-3 paragraphs that:
1. Acknowledge what's working well
2. Highlight the top priority area for improvement
3. Suggest a specific action step for this week`;

  const summaryResponse = await claudeService.chat(
    systemPrompt,
    summaryPrompt,
    { maxTokens: 1024, temperature: 0.7 }
  );

  console.log('[coaching.handler] Aggregate coaching complete');

  return {
    success: true,
    data: {
      type: 'aggregate_coaching',
      start_date: startDate,
      end_date: endDate,
      call_count: recentCalls.length,
      team_insights: insights.team_insights,
      focus_area: insights.focus_area,
      recommendations: insights.recommendations,
      summary: summaryResponse.content,
    },
  };
}

/**
 * Handle coaching intent - analyze a call transcript and provide coaching feedback
 */
export async function handleCoaching(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    const callId = params.callId;

    // If no callId provided, generate aggregate coaching recommendations
    if (!callId) {
      return handleAggregateCoaching(params);
    }

    console.log(`[coaching.handler] Starting coaching analysis for call: ${callId}`);

    // Get call metadata first
    const callMetadata = await callsService.getCallById(callId);
    if (!callMetadata) {
      return formatError(ErrorMessages.callNotFound(callId));
    }

    // Get agent details
    const agent = await agentsService.getAgentById(callMetadata.agent_user_id);
    const agentName = agent?.first_name || 'Unknown';

    console.log(`[coaching.handler] Call found - Agent: ${agentName}, Date: ${callMetadata.call_date}`);

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (!transcript || !transcript.full_transcript) {
      return formatError(ErrorMessages.transcriptNotReady(callId));
    }

    console.log(`[coaching.handler] Transcript retrieved (${transcript.full_transcript.length} chars)`);

    // Fetch the active rubric configuration from database
    const rubricConfig = await rubricService.getActiveConfig();

    if (rubricConfig) {
      console.log(`[coaching.handler] Using dynamic rubric: "${rubricConfig.name}" (v${rubricConfig.version})`);
    } else {
      console.log(`[coaching.handler] No active rubric found, using hardcoded prompts`);
    }

    // Prepare variables for the coaching analysis prompt
    const coachingVars: CoachingVariables = {
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      duration: transcript.total_duration_formatted || 'Unknown',
      customer_talk_ratio: String(transcript.customer_talk_percentage || callMetadata.customer_talk_percentage || 0),
      agent_talk_ratio: String(transcript.agent_talk_percentage || callMetadata.agent_talk_percentage || 0),
      transcript: transcript.full_transcript,
    };

    // Build the analysis prompt (dynamic if rubric exists, fallback to static)
    let systemPrompt: string;
    let analysisPrompt: string;

    if (rubricConfig) {
      systemPrompt = buildDynamicSystemPrompt(rubricConfig);
      analysisPrompt = buildDynamicCoachingPrompt(rubricConfig, coachingVars);
    } else {
      systemPrompt = COACHING_SYSTEM_PROMPT;
      analysisPrompt = buildCoachingAnalysisPrompt(coachingVars);
    }

    console.log(`[coaching.handler] Sending transcript to Claude for analysis...`);

    // Call Claude to analyze the transcript
    // Using higher max tokens because coaching analysis is detailed
    const analysis = await claudeService.chatJSON<CoachingAnalysis>(
      systemPrompt,
      analysisPrompt,
      { maxTokens: 4096 }
    );

    console.log(`[coaching.handler] Analysis complete - Overall score: ${analysis.overall_score}, Level: ${analysis.performance_level}`);

    // Now generate a human-friendly summary
    let summaryPrompt: string;

    if (rubricConfig) {
      summaryPrompt = buildDynamicSummaryPrompt(rubricConfig, {
        coaching_json: JSON.stringify(analysis, null, 2),
        agent_name: agentName,
        call_date: transcript.call_date || callMetadata.call_date,
        duration: transcript.total_duration_formatted || 'Unknown',
      });
    } else {
      summaryPrompt = buildCoachingSummaryPrompt({
        coaching_json: JSON.stringify(analysis, null, 2),
        agent_name: agentName,
        call_date: transcript.call_date || callMetadata.call_date,
        duration: transcript.total_duration_formatted || 'Unknown',
      });
    }

    console.log(`[coaching.handler] Generating coaching summary...`);

    const summaryResponse = await claudeService.chat(
      systemPrompt,
      summaryPrompt,
      { maxTokens: 2048, temperature: 0.7 }
    );

    console.log(`[coaching.handler] Coaching analysis complete`);

    // Check for critical red flags that need immediate attention
    const hasCriticalFlags = analysis.red_flags.critical.length > 0;
    if (hasCriticalFlags) {
      console.log(`[coaching.handler] CRITICAL RED FLAGS DETECTED:`, analysis.red_flags.critical);
    }

    return {
      success: true,
      data: {
        type: 'coaching',
        call_id: callId,
        agent_name: agentName,
        agent_user_id: callMetadata.agent_user_id,
        call_date: transcript.call_date || callMetadata.call_date,
        duration: transcript.total_duration_formatted || 'Unknown',
        talk_ratio: {
          agent: transcript.agent_talk_percentage || callMetadata.agent_talk_percentage,
          customer: transcript.customer_talk_percentage || callMetadata.customer_talk_percentage,
        },
        analysis: {
          scores: analysis.scores,
          overall_score: analysis.overall_score,
          performance_level: analysis.performance_level,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          action_items: analysis.action_items,
          red_flags: analysis.red_flags,
          notable_moments: analysis.notable_moments,
        },
        summary: summaryResponse.content,
        has_critical_flags: hasCriticalFlags,
        rubric_config_id: rubricConfig?.id || null,
        rubric_version: rubricConfig?.version || null,
      },
    };
  } catch (error) {
    console.error(`[coaching.handler] Error:`, error);
    return formatError(buildErrorMessage(error, { operation: 'generate coaching feedback' }));
  }
}
