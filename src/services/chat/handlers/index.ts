import { Intent, HandlerParams, HandlerResult } from '../../../types/index.js';
import { handleListCalls } from './list-calls.handler.js';
import { handleAgentStats } from './agent-stats.handler.js';
import { handleTeamSummary } from './team-summary.handler.js';
import { handleGetTranscript } from './get-transcript.handler.js';
import { handleSearchCalls } from './search-calls.handler.js';
import { handleCoaching } from './coaching.handler.js';
import { handleObjectionAnalysis } from './objection-analysis.handler.js';
import { handleGeneral } from './general.handler.js';

export type Handler = (params: HandlerParams, originalMessage: string) => Promise<HandlerResult>;

const handlers: Record<Intent, Handler> = {
  [Intent.LIST_CALLS]: handleListCalls,
  [Intent.AGENT_STATS]: handleAgentStats,
  [Intent.TEAM_SUMMARY]: handleTeamSummary,
  [Intent.GET_TRANSCRIPT]: handleGetTranscript,
  [Intent.SEARCH_CALLS]: handleSearchCalls,
  [Intent.COACHING]: handleCoaching,
  [Intent.OBJECTION_ANALYSIS]: handleObjectionAnalysis,
  [Intent.GENERAL]: handleGeneral,
};

export function getHandler(intent: Intent): Handler {
  return handlers[intent] || handleGeneral;
}

export {
  handleListCalls,
  handleAgentStats,
  handleTeamSummary,
  handleGetTranscript,
  handleSearchCalls,
  handleCoaching,
  handleObjectionAnalysis,
  handleGeneral,
};
