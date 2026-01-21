import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { transcriptsService } from '../../database/transcripts.service.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { claudeService } from '../../ai/claude.service.js';
import {
  OBJECTION_ANALYSIS_SYSTEM_PROMPT,
  buildObjectionAnalysisPrompt,
  buildObjectionSummaryPrompt,
  ObjectionAnalysisVariables,
} from '../../../prompts/objection-analysis.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

/**
 * Individual objection found in the call
 */
export interface ObjectionFound {
  objection_type: string;
  objection_text: string;
  customer_sentiment: 'mild' | 'moderate' | 'strong';
  agent_response: string;
  response_quality: number;
  techniques_used: string[];
  techniques_missed: string[];
  was_resolved: boolean;
  improvement_suggestion: string;
}

/**
 * Missed objection that wasn't addressed
 */
export interface MissedObjection {
  description: string;
  where_in_call: 'early' | 'middle' | 'late';
  what_to_look_for: string;
}

/**
 * Full objection analysis result from Claude
 */
export interface ObjectionAnalysis {
  objections_found: ObjectionFound[];
  overall_objection_handling_score: number | null;
  total_objections: number;
  resolved_count: number;
  missed_objections: MissedObjection[];
  strongest_moment: {
    description: string;
    quote: string;
  } | null;
  biggest_opportunity: {
    description: string;
    suggestion: string;
  } | null;
  patterns: {
    agent_tendencies: string[];
    customer_signals: string[];
  };
  no_objections_note?: string;
}

/**
 * Handle objection analysis intent - deep-dive into objections in a call
 */
export async function handleObjectionAnalysis(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    const callId = params.callId;

    if (!callId) {
      return formatError(ErrorMessages.callRequired());
    }

    console.log(`[objection-analysis.handler] Starting objection analysis for call: ${callId}`);

    // Get call metadata first
    const callMetadata = await callsService.getCallById(callId);
    if (!callMetadata) {
      return formatError(ErrorMessages.callNotFound(callId));
    }

    // Get agent details
    const agent = await agentsService.getAgentById(callMetadata.agent_user_id);
    const agentName = agent?.first_name || 'Unknown';

    console.log(`[objection-analysis.handler] Call found - Agent: ${agentName}, Date: ${callMetadata.call_date}`);

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (!transcript || !transcript.full_transcript) {
      return formatError(ErrorMessages.transcriptNotReady(callId));
    }

    console.log(`[objection-analysis.handler] Transcript retrieved (${transcript.full_transcript.length} chars)`);

    // Prepare variables for the analysis prompt
    const analysisVars: ObjectionAnalysisVariables = {
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      duration: transcript.total_duration_formatted || 'Unknown',
      transcript: transcript.full_transcript,
    };

    // Build the analysis prompt
    const analysisPrompt = buildObjectionAnalysisPrompt(analysisVars);

    console.log(`[objection-analysis.handler] Sending transcript to Claude for objection analysis...`);

    // Call Claude to analyze objections
    const analysis = await claudeService.chatJSON<ObjectionAnalysis>(
      OBJECTION_ANALYSIS_SYSTEM_PROMPT,
      analysisPrompt,
      { maxTokens: 4096 }
    );

    console.log(`[objection-analysis.handler] Analysis complete - Found ${analysis.total_objections} objections, resolved ${analysis.resolved_count}`);

    // Generate human-friendly summary
    const summaryPrompt = buildObjectionSummaryPrompt({
      analysis_json: JSON.stringify(analysis, null, 2),
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
    });

    console.log(`[objection-analysis.handler] Generating objection analysis summary...`);

    const summaryResponse = await claudeService.chat(
      OBJECTION_ANALYSIS_SYSTEM_PROMPT,
      summaryPrompt,
      { maxTokens: 1024, temperature: 0.7 }
    );

    console.log(`[objection-analysis.handler] Objection analysis complete`);

    return {
      success: true,
      data: {
        type: 'objection_analysis',
        call_id: callId,
        agent_name: agentName,
        agent_user_id: callMetadata.agent_user_id,
        call_date: transcript.call_date || callMetadata.call_date,
        duration: transcript.total_duration_formatted || 'Unknown',
        analysis: {
          objections_found: analysis.objections_found,
          overall_score: analysis.overall_objection_handling_score,
          total_objections: analysis.total_objections,
          resolved_count: analysis.resolved_count,
          missed_objections: analysis.missed_objections,
          strongest_moment: analysis.strongest_moment,
          biggest_opportunity: analysis.biggest_opportunity,
          patterns: analysis.patterns,
          no_objections_note: analysis.no_objections_note,
        },
        summary: summaryResponse.content,
      },
    };
  } catch (error) {
    console.error(`[objection-analysis.handler] Error:`, error);
    return formatError(buildErrorMessage(error, { operation: 'analyze objections' }));
  }
}
