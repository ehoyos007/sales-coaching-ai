import {
  HandlerParams,
  HandlerResult,
  EnhancedObjectionAnalysis,
  EnhancedObjectionFound,
  RecordObjectionInput,
  AgentObjectionHistory,
} from '../../../types/index.js';
import { transcriptsService } from '../../database/transcripts.service.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';
import { agentObjectionStatsService } from '../../database/agent-objection-stats.service.js';
import { claudeService } from '../../ai/claude.service.js';
import {
  OBJECTION_ANALYSIS_SYSTEM_PROMPT,
  buildEnhancedObjectionAnalysisPrompt,
  buildPatternAwareObjectionSummaryPrompt,
  EnhancedObjectionAnalysisVariables,
} from '../../../prompts/objection-analysis.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

// Re-export types for backward compatibility
export type { EnhancedObjectionFound as ObjectionFound } from '../../../types/index.js';
export type { EnhancedObjectionAnalysis as ObjectionAnalysis } from '../../../types/index.js';

/**
 * Missed objection that wasn't addressed
 */
export interface MissedObjection {
  description: string;
  where_in_call: 'early' | 'middle' | 'late';
  what_to_look_for: string;
}

/**
 * Handle objection analysis intent - deep-dive into objections in a call
 * Enhanced with snippet extraction and pattern-aware coaching
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
    const agentUserId = callMetadata.agent_user_id;

    console.log(`[objection-analysis.handler] Call found - Agent: ${agentName}, Date: ${callMetadata.call_date}`);

    // Fetch agent's objection history in parallel (non-blocking on error)
    let agentHistory: AgentObjectionHistory | null = null;
    const historyPromise = agentObjectionStatsService.getAgentObjectionHistory(agentUserId)
      .catch((err) => {
        console.warn('[objection-analysis.handler] Failed to fetch agent history (non-blocking):', err);
        return null;
      });

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (!transcript || !transcript.full_transcript) {
      return formatError(ErrorMessages.transcriptNotReady(callId));
    }

    console.log(`[objection-analysis.handler] Transcript retrieved (${transcript.full_transcript.length} chars)`);

    // Wait for history to resolve
    agentHistory = await historyPromise;
    if (agentHistory && agentHistory.total_analyzed > 0) {
      console.log(`[objection-analysis.handler] Agent history loaded: ${agentHistory.total_analyzed} objections analyzed previously`);
    }

    // Prepare variables for the enhanced analysis prompt
    const analysisVars: EnhancedObjectionAnalysisVariables = {
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      duration: transcript.total_duration_formatted || 'Unknown',
      transcript: transcript.full_transcript,
    };

    // Build the enhanced analysis prompt (with snippet extraction)
    const analysisPrompt = buildEnhancedObjectionAnalysisPrompt(analysisVars);

    console.log(`[objection-analysis.handler] Sending transcript to Claude for enhanced objection analysis...`);

    // Call Claude to analyze objections
    const analysis = await claudeService.chatJSON<EnhancedObjectionAnalysis>(
      OBJECTION_ANALYSIS_SYSTEM_PROMPT,
      analysisPrompt,
      { maxTokens: 4096 }
    );

    console.log(`[objection-analysis.handler] Analysis complete - Found ${analysis.total_objections} objections, resolved ${analysis.resolved_count}`);

    // Record objections to database (fire-and-forget, non-blocking)
    if (analysis.objections_found.length > 0) {
      const recordInputs: RecordObjectionInput[] = analysis.objections_found.map((obj: EnhancedObjectionFound) => ({
        agent_user_id: agentUserId,
        call_id: callId,
        objection_type: obj.objection_type,
        response_quality: obj.response_quality,
        was_resolved: obj.was_resolved,
        customer_sentiment: obj.customer_sentiment,
        objection_snippet: obj.snippet?.objection_text || obj.objection_text,
        rebuttal_snippet: obj.snippet?.rebuttal_text || obj.agent_response,
        full_exchange: obj.snippet?.full_exchange,
      }));

      // Fire-and-forget - don't await, don't block
      agentObjectionStatsService.recordObjections(recordInputs).catch((err) => {
        console.warn('[objection-analysis.handler] Failed to record objections (non-blocking):', err);
      });
    }

    // Generate pattern-aware summary
    const summaryPrompt = buildPatternAwareObjectionSummaryPrompt({
      analysis_json: JSON.stringify(analysis, null, 2),
      agent_name: agentName,
      call_date: transcript.call_date || callMetadata.call_date,
      agent_history: agentHistory && agentHistory.total_analyzed > 0 ? {
        weak_areas: agentHistory.weak_areas.map(a => ({
          objection_type: a.objection_type,
          avg_score: a.avg_score,
          total_occurrences: a.total_occurrences,
        })),
        strong_areas: agentHistory.strong_areas.map(a => ({
          objection_type: a.objection_type,
          avg_score: a.avg_score,
          total_occurrences: a.total_occurrences,
        })),
        total_analyzed: agentHistory.total_analyzed,
        overall_avg_score: agentHistory.overall_avg_score,
      } : undefined,
    });

    console.log(`[objection-analysis.handler] Generating pattern-aware objection analysis summary...`);

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
        agent_user_id: agentUserId,
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
        agent_history: agentHistory,
      },
    };
  } catch (error) {
    console.error(`[objection-analysis.handler] Error:`, error);
    return formatError(buildErrorMessage(error, { operation: 'analyze objections' }));
  }
}
