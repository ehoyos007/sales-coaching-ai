import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { transcriptsService } from '../../database/transcripts.service.js';
import { callsService } from '../../database/calls.service.js';
import { agentsService } from '../../database/agents.service.js';

export async function handleGetTranscript(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    const callId = params.callId;

    if (!callId) {
      return {
        success: false,
        data: null,
        error: 'Please specify which call transcript you want to see. You can provide a call ID.',
      };
    }

    // First get call metadata
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

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (!transcript) {
      // Fall back to raw turns
      const turns = await transcriptsService.getCallTurns(callId);
      const formattedTranscript = transcriptsService.formatTranscript(turns);

      return {
        success: true,
        data: {
          type: 'transcript',
          call_id: callId,
          agent_name: agentName,
          agent_user_id: callMetadata.agent_user_id,
          call_date: callMetadata.call_date,
          duration: callMetadata.total_duration_formatted,
          is_inbound: callMetadata.is_inbound_call,
          talk_ratio: {
            agent: callMetadata.agent_talk_percentage,
            customer: callMetadata.customer_talk_percentage,
          },
          total_turns: callMetadata.total_turns,
          transcript_text: formattedTranscript,
          turns,
        },
      };
    }

    // Parse the full_transcript into turns
    const turns = transcript.full_transcript
      ? transcriptsService.parseTranscriptText(
          transcript.full_transcript,
          callId,
          callMetadata.agent_user_id
        )
      : [];

    return {
      success: true,
      data: {
        type: 'transcript',
        call_id: callId,
        agent_name: transcript.agent_name || agentName,
        agent_user_id: callMetadata.agent_user_id,
        call_date: transcript.call_date,
        duration: transcript.total_duration_formatted,
        is_inbound: callMetadata.is_inbound_call,
        talk_ratio: {
          agent: callMetadata.agent_talk_percentage,
          customer: callMetadata.customer_talk_percentage,
        },
        total_turns: callMetadata.total_turns,
        turns,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: `Failed to fetch transcript: ${message}`,
    };
  }
}
