import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { transcriptsService } from '../../database/transcripts.service.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { claudeService } from '../../ai/claude.service.js';
import {
  COACHING_SYSTEM_PROMPT,
  buildCoachingAnalysisPrompt,
  buildCoachingSummaryPrompt,
  CoachingVariables,
} from '../../../prompts/coaching-analysis.js';

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
 * Handle coaching intent - analyze a call transcript and provide coaching feedback
 */
export async function handleCoaching(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    const callId = params.callId;

    if (!callId) {
      return {
        success: false,
        data: null,
        error:
          'Please specify which call you want coaching feedback on. You can provide a call ID or ask about a specific agent\'s recent calls.',
      };
    }

    console.log(`[coaching.handler] Starting coaching analysis for call: ${callId}`);

    // Get call metadata first
    const callMetadata = await callsService.getCallById(callId);
    if (!callMetadata) {
      return {
        success: false,
        data: null,
        error: `Could not find a call with ID "${callId}".`,
      };
    }

    // Get agent details
    const agent = await agentsService.getAgentById(callMetadata.agent_user_id);
    const agentName = agent?.first_name || 'Unknown';

    console.log(`[coaching.handler] Call found - Agent: ${agentName}, Date: ${callMetadata.call_date}`);

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (!transcript || !transcript.full_transcript) {
      return {
        success: false,
        data: null,
        error: `Could not find transcript data for call "${callId}". The transcript may not have been processed yet.`,
      };
    }

    console.log(`[coaching.handler] Transcript retrieved (${transcript.full_transcript.length} chars)`);

    // Prepare variables for the coaching analysis prompt
    const coachingVars: CoachingVariables = {
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      duration: transcript.total_duration_formatted || 'Unknown',
      customer_talk_ratio: String(transcript.customer_talk_percentage || callMetadata.customer_talk_percentage || 0),
      agent_talk_ratio: String(transcript.agent_talk_percentage || callMetadata.agent_talk_percentage || 0),
      transcript: transcript.full_transcript,
    };

    // Build the analysis prompt
    const analysisPrompt = buildCoachingAnalysisPrompt(coachingVars);

    console.log(`[coaching.handler] Sending transcript to Claude for analysis...`);

    // Call Claude to analyze the transcript
    // Using higher max tokens because coaching analysis is detailed
    const analysis = await claudeService.chatJSON<CoachingAnalysis>(
      COACHING_SYSTEM_PROMPT,
      analysisPrompt,
      { maxTokens: 4096 }
    );

    console.log(`[coaching.handler] Analysis complete - Overall score: ${analysis.overall_score}, Level: ${analysis.performance_level}`);

    // Now generate a human-friendly summary
    const summaryPrompt = buildCoachingSummaryPrompt({
      coaching_json: JSON.stringify(analysis, null, 2),
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      duration: transcript.total_duration_formatted || 'Unknown',
    });

    console.log(`[coaching.handler] Generating coaching summary...`);

    const summaryResponse = await claudeService.chat(
      COACHING_SYSTEM_PROMPT,
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
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[coaching.handler] Error:`, error);
    return {
      success: false,
      data: null,
      error: `Failed to generate coaching feedback: ${message}`,
    };
  }
}
