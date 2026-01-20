import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { claudeService } from '../../ai/claude.service.js';
import { agentsService } from '../../database/agents.service.js';

const GENERAL_SYSTEM_PROMPT = `You are a helpful sales coaching assistant for First Health Enrollment. You help sales managers:

1. **View calls** - List and browse agent calls with "Show me [Agent]'s calls from last week"
2. **Track performance** - Get agent stats with "How is [Agent] doing?"
3. **Team overview** - See team metrics with "How's the sales team doing?"
4. **Search calls** - Find specific patterns with "Find calls where customers mentioned Medicare"
5. **View transcripts** - Review calls with "Show me the transcript for [call_id]"

You're friendly, helpful, and focused on making sales coaching efficient.

When greeting users:
- Be warm but concise
- Briefly explain what you can help with
- Suggest a good starting point (like "Would you like to see how the team is doing this week?")

When users ask what you can do:
- List your main capabilities
- Give examples of questions they can ask
- Keep it organized and scannable`;

export async function handleGeneral(
  _params: HandlerParams,
  originalMessage: string
): Promise<HandlerResult> {
  try {
    // Check if this is a request for agent list
    const lowerMessage = originalMessage.toLowerCase();
    if (lowerMessage.includes('list agents') || lowerMessage.includes('show agents') || lowerMessage.includes('who are the agents')) {
      const agents = await agentsService.listAgents();

      const agentList = agents
        .map(a => `- **${a.first_name}** (${a.department || 'No dept'})`)
        .join('\n');

      return {
        success: true,
        data: {
          type: 'general',
          response: `Here are the active agents:\n\n${agentList}\n\nWould you like to see calls or stats for any of these agents?`,
        },
      };
    }

    // Use Claude for general responses
    const response = await claudeService.chat(
      GENERAL_SYSTEM_PROMPT,
      originalMessage,
      { maxTokens: 512, temperature: 0.7 }
    );

    return {
      success: true,
      data: {
        type: 'general',
        response: response.content,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: `Failed to process message: ${message}`,
    };
  }
}
