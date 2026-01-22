/**
 * Chat Service for Vercel serverless functions
 * Orchestrates intent classification, data retrieval, and response generation
 */
import { intentService, ClassifiedIntent, IntentType } from './intent.service';
import { agentsService } from './agents.service';
import { callsService } from './calls.service';
import { transcriptsService } from './transcripts.service';
import { sessionsService } from './sessions.service';
import { searchService } from './search.service';
import { embeddingsService } from './embeddings.service';
import { claudeService } from './claude.service';
import type { DataAccessScope } from './auth.service';

// =============================================
// TYPES
// =============================================

export interface ChatContext {
  agent_user_id?: string;
  call_id?: string;
  department?: string;
}

export interface UserContext {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  teamId: string | null;
  agentUserId: string | null;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  intent: IntentType;
  data?: unknown;
  session_id?: string;
  error?: string;
}

// =============================================
// CHAT SERVICE CLASS
// =============================================

export class ChatService {
  /**
   * Process a chat message
   */
  async processMessage(
    message: string,
    context?: ChatContext,
    sessionId?: string,
    userContext?: UserContext,
    dataScope?: DataAccessScope
  ): Promise<ChatResponse> {
    try {
      // Get or create session
      const actualSessionId = sessionId || crypto.randomUUID();
      const session = await sessionsService.getOrCreateSession({
        session_id: actualSessionId,
        user_id: userContext?.userId,
        context: context || {},
      });

      // Save user message
      await sessionsService.saveMessage({
        session_id: session.id,
        role: 'user',
        content: message,
      });

      // Classify intent
      const intent = await intentService.classify(message);
      console.log('[chat.service] Classified intent:', intent.intent);

      // Resolve agent if mentioned by name
      if (intent.agent_name && dataScope) {
        const resolved = await agentsService.resolveByNameScoped(
          intent.agent_name,
          dataScope.agentUserIds
        );
        if (resolved) {
          intent.agent_user_id = resolved.agent_user_id;
        }
      }

      // Process based on intent
      const result = await this.handleIntent(intent, context, dataScope);

      // Save assistant response
      await sessionsService.saveMessage({
        session_id: session.id,
        role: 'assistant',
        content: result.message,
        intent: intent.intent,
        data: result.data as Record<string, unknown> | undefined,
      });

      return {
        success: true,
        message: result.message,
        intent: intent.intent,
        data: result.data,
        session_id: session.id,
      };
    } catch (error) {
      console.error('[chat.service] Error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        intent: 'GENERAL',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle classified intent
   */
  private async handleIntent(
    intent: ClassifiedIntent,
    context?: ChatContext,
    dataScope?: DataAccessScope
  ): Promise<{ message: string; data?: unknown }> {
    const agentUserIds = dataScope?.agentUserIds || [];
    const agentId = intent.agent_user_id || context?.agent_user_id;
    const daysBack = intent.days_back || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    switch (intent.intent) {
      case 'LIST_CALLS': {
        if (agentId) {
          const calls = await callsService.getAgentCalls(
            agentId,
            startDateStr,
            endDateStr,
            20
          );
          const agent = await agentsService.getAgentById(agentId);
          const agentName = agent?.first_name || 'Unknown';
          return {
            message: `Here are ${agentName}'s recent calls:\n\n${this.formatCallsList(calls)}`,
            data: calls,
          };
        } else if (agentUserIds.length > 0) {
          const calls = await callsService.getCallsForAgents(
            agentUserIds,
            startDateStr,
            endDateStr,
            20
          );
          return {
            message: `Here are the recent calls:\n\n${this.formatCallsList(calls)}`,
            data: calls,
          };
        }
        return { message: 'Please specify an agent or ensure you have access to view calls.' };
      }

      case 'AGENT_STATS': {
        if (!agentId) {
          return { message: 'Please specify which agent you want stats for.' };
        }
        const performance = await callsService.getAgentPerformance(
          agentId,
          startDateStr,
          endDateStr
        );
        const agent = await agentsService.getAgentById(agentId);
        const agentName = agent?.first_name || 'Unknown';
        return {
          message: `Performance stats for ${agentName}:\n\n${this.formatPerformance(performance)}`,
          data: performance,
        };
      }

      case 'TEAM_SUMMARY': {
        const allStats = await Promise.all(
          agentUserIds.slice(0, 10).map(async (id) => {
            const perf = await callsService.getAgentPerformance(id, startDateStr, endDateStr);
            const agent = await agentsService.getAgentById(id);
            return { agent: agent?.first_name || id, ...perf };
          })
        );
        return {
          message: `Team Summary:\n\n${this.formatTeamSummary(allStats)}`,
          data: allStats,
        };
      }

      case 'GET_TRANSCRIPT': {
        const callId = intent.call_id || context?.call_id;
        if (!callId) {
          return { message: 'Please specify which call transcript you want to see.' };
        }
        const transcript = await transcriptsService.getCallTranscript(callId);
        if (!transcript) {
          return { message: `Transcript for call ${callId} not found.` };
        }
        return {
          message: `Transcript for call ${callId}:\n\n${this.formatTranscript(transcript)}`,
          data: transcript,
        };
      }

      case 'SEARCH_CALLS': {
        const query = intent.search_query;
        if (!query) {
          return { message: 'What would you like to search for?' };
        }
        const embedding = await embeddingsService.getEmbedding(query);
        const results = await searchService.semanticSearch({
          embedding,
          agentUserIds: agentUserIds.length > 0 ? agentUserIds : undefined,
          limit: 10,
        });
        return {
          message: `Search results for "${query}":\n\n${this.formatSearchResults(results)}`,
          data: results,
        };
      }

      case 'COACHING':
      case 'OBJECTION_ANALYSIS': {
        const callId = intent.call_id || context?.call_id;
        if (!callId) {
          return { message: 'Please specify which call you want analyzed.' };
        }
        const transcript = await transcriptsService.getFormattedTranscript(callId);
        if (!transcript) {
          return { message: `Call ${callId} not found.` };
        }
        // Format turns into text for analysis
        const formattedText = transcript.turns
          .map((turn) => `${turn.speaker}: ${turn.text}`)
          .join('\n');
        const analysis = await this.runCoachingAnalysis(
          formattedText,
          intent.intent
        );
        return {
          message: analysis,
          data: { callId, type: intent.intent },
        };
      }

      case 'GENERAL':
      default: {
        return {
          message: await this.generateGeneralResponse(
            intent,
            dataScope?.isFloorWide ? 'all agents' : 'your accessible agents'
          ),
        };
      }
    }
  }

  /**
   * Run coaching or objection analysis
   */
  private async runCoachingAnalysis(
    transcript: string,
    type: IntentType
  ): Promise<string> {
    const systemPrompt =
      type === 'OBJECTION_ANALYSIS'
        ? `You are an expert sales coach analyzing objection handling. Analyze the transcript and provide:
1. List of objections raised by the customer
2. How the agent responded to each
3. What was effective
4. What could be improved
5. Specific suggestions for better handling

Be constructive and specific.`
        : `You are an expert sales coach. Analyze this call and provide:
1. Overall performance assessment
2. Strengths demonstrated
3. Areas for improvement
4. Specific coaching recommendations
5. Example phrases the agent could use

Be constructive and actionable.`;

    const response = await claudeService.complete(
      systemPrompt,
      `Analyze this call transcript:\n\n${transcript.slice(0, 10000)}`,
      { maxTokens: 2000 }
    );

    return response;
  }

  /**
   * Generate a general response
   */
  private async generateGeneralResponse(
    intent: ClassifiedIntent,
    scopeDescription: string
  ): Promise<string> {
    const systemPrompt = `You are a helpful sales coaching AI assistant. You help managers and agents analyze call performance and improve sales techniques.

Available commands:
- List calls for an agent
- Show agent stats/performance
- Get team summary
- View call transcript
- Search calls for specific content
- Run coaching analysis on a call
- Analyze objection handling

Data scope: ${scopeDescription}`;

    const response = await claudeService.complete(
      systemPrompt,
      'The user said: ' + (intent.agent_name || 'hello'),
      { maxTokens: 500 }
    );

    return response;
  }

  // =============================================
  // FORMATTING HELPERS
  // =============================================

  private formatCallsList(calls: unknown[]): string {
    if (!calls || calls.length === 0) return 'No calls found.';
    return calls
      .slice(0, 10)
      .map((c: unknown) => {
        const call = c as Record<string, unknown>;
        return `- ${call.call_date || 'Unknown date'}: ${call.duration_seconds || 0}s - ${call.customer_name || 'Unknown'}`;
      })
      .join('\n');
  }

  private formatPerformance(perf: unknown): string {
    if (!perf) return 'No performance data available.';
    const p = perf as Record<string, unknown>;
    return `
- Total Calls: ${p.total_calls || 0}
- Avg Duration: ${p.avg_duration || 0}s
- Conversion Rate: ${((p.conversion_rate as number) || 0) * 100}%
`.trim();
  }

  private formatTeamSummary(stats: unknown[]): string {
    if (!stats || stats.length === 0) return 'No team data available.';
    return stats
      .map((s: unknown) => {
        const stat = s as Record<string, unknown>;
        return `${stat.agent}: ${stat.total_calls || 0} calls`;
      })
      .join('\n');
  }

  private formatTranscript(transcript: unknown): string {
    const t = transcript as Record<string, unknown>;
    if (!t.turns) return 'Transcript not available.';
    const turns = t.turns as Array<{ speaker: string; text: string }>;
    return turns
      .slice(0, 50)
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join('\n');
  }

  private formatSearchResults(results: unknown[]): string {
    if (!results || results.length === 0) return 'No results found.';
    return results
      .slice(0, 5)
      .map((r: unknown) => {
        const result = r as Record<string, unknown>;
        return `- Call ${result.call_id}: "${(result.chunk_text as string)?.slice(0, 100)}..."`;
      })
      .join('\n\n');
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let chatServiceInstance: ChatService | null = null;

export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService();
  }
  return chatServiceInstance;
}

export const chatService = getChatService();
