import { Request, Response } from 'express';
import { callsService } from '../services/database/calls.service.js';
import { transcriptsService } from '../services/database/transcripts.service.js';

export async function getCall(req: Request, res: Response): Promise<void> {
  try {
    const { callId } = req.params;

    if (!callId) {
      res.status(400).json({
        success: false,
        error: 'Call ID is required',
      });
      return;
    }

    const call = await callsService.getCallById(callId);

    if (!call) {
      res.status(404).json({
        success: false,
        error: 'Call not found',
      });
      return;
    }

    res.json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error('Get call error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get call: ${message}`,
    });
  }
}

export async function getCallTranscript(req: Request, res: Response): Promise<void> {
  try {
    const { callId } = req.params;
    const { format } = req.query;

    if (!callId) {
      res.status(400).json({
        success: false,
        error: 'Call ID is required',
      });
      return;
    }

    // First verify the call exists
    const call = await callsService.getCallById(callId);
    if (!call) {
      res.status(404).json({
        success: false,
        error: 'Call not found',
      });
      return;
    }

    // Get transcript
    const transcript = await transcriptsService.getCallTranscript(callId);

    if (transcript) {
      res.json({
        success: true,
        data: {
          call_id: callId,
          agent_name: transcript.agent_name,
          call_date: transcript.call_date,
          duration: transcript.total_duration_formatted,
          turns: transcript.turns,
        },
      });
      return;
    }

    // Fall back to raw turns
    const turns = await transcriptsService.getCallTurns(callId);

    if (turns.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Transcript not found for this call',
      });
      return;
    }

    // Format based on query param
    if (format === 'raw') {
      res.json({
        success: true,
        data: {
          call_id: callId,
          turns,
        },
      });
    } else {
      const formatted = transcriptsService.formatTranscript(turns);
      res.json({
        success: true,
        data: {
          call_id: callId,
          transcript_text: formatted,
          turns,
        },
      });
    }
  } catch (error) {
    console.error('Get call transcript error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get call transcript: ${message}`,
    });
  }
}

export const callsController = {
  getCall,
  getCallTranscript,
};
