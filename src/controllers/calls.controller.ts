import { Request, Response } from 'express';
import { callsService } from '../services/database/calls.service.js';
import { transcriptsService } from '../services/database/transcripts.service.js';

export async function getCall(req: Request, res: Response): Promise<void> {
  const { callId } = req.params;
  console.log(`[calls.controller] GET /calls/${callId}`);

  try {
    if (!callId) {
      console.log(`[calls.controller] Missing callId`);
      res.status(400).json({
        success: false,
        error: 'Call ID is required',
      });
      return;
    }

    console.log(`[calls.controller] Fetching call metadata...`);
    const call = await callsService.getCallById(callId);

    if (!call) {
      console.log(`[calls.controller] Call not found: ${callId}`);
      res.status(404).json({
        success: false,
        error: 'Call not found',
      });
      return;
    }

    console.log(`[calls.controller] Call found, returning metadata`);
    res.json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error(`[calls.controller] GET /calls/${callId} ERROR:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[calls.controller] Stack trace:`, stack);
    res.status(500).json({
      success: false,
      error: `Failed to get call: ${message}`,
    });
  }
}

export async function getCallTranscript(req: Request, res: Response): Promise<void> {
  const { callId } = req.params;
  console.log(`[calls.controller] GET /calls/${callId}/transcript`);

  try {
    if (!callId) {
      console.log(`[calls.controller] Missing callId`);
      res.status(400).json({
        success: false,
        error: 'Call ID is required',
      });
      return;
    }

    // First verify the call exists
    console.log(`[calls.controller] Step 1: Verifying call exists...`);
    const call = await callsService.getCallById(callId);
    if (!call) {
      console.log(`[calls.controller] Call not found: ${callId}`);
      res.status(404).json({
        success: false,
        error: 'Call not found',
      });
      return;
    }
    console.log(`[calls.controller] Call found: agent_user_id=${call.agent_user_id}`);

    // Get transcript metadata from PostgreSQL function
    console.log(`[calls.controller] Step 2: Fetching transcript via RPC...`);
    const transcriptMeta = await transcriptsService.getCallTranscript(callId);

    if (!transcriptMeta) {
      console.log(`[calls.controller] No transcript metadata returned from RPC`);
      res.status(404).json({
        success: false,
        error: 'Transcript not found for this call',
      });
      return;
    }

    console.log(`[calls.controller] Transcript metadata received:`, {
      agent_name: transcriptMeta.agent_name,
      total_turns: transcriptMeta.total_turns,
      has_full_transcript: !!transcriptMeta.full_transcript,
    });

    // Try to get turns from call_turns table first
    console.log(`[calls.controller] Step 3: Trying call_turns table...`);
    let turns = await transcriptsService.getCallTurns(callId);

    // If no turns in table, parse from full_transcript text
    if (turns.length === 0 && transcriptMeta.full_transcript) {
      console.log(`[calls.controller] Step 4: Parsing turns from full_transcript text...`);
      turns = transcriptsService.parseTranscriptText(
        transcriptMeta.full_transcript,
        callId,
        call.agent_user_id
      );
    }

    console.log(`[calls.controller] Final turn count: ${turns.length}`);

    res.json({
      success: true,
      data: {
        call_id: callId,
        agent_name: transcriptMeta.agent_name,
        call_date: transcriptMeta.call_date,
        total_duration_formatted: transcriptMeta.total_duration_formatted,
        turns: turns,
      },
    });
  } catch (error) {
    console.error(`[calls.controller] GET /calls/${callId}/transcript ERROR:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[calls.controller] Stack trace:`, stack);
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
