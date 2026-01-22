/**
 * Services barrel export for Vercel serverless functions
 */

// Agents Service
export {
  AgentsService,
  getAgentsService,
  agentsService,
  type Agent,
  type AgentWithStats,
  type ResolvedAgent,
} from './agents.service';

// Auth Service
export {
  AuthService,
  getAuthService,
  authService,
  type UserRole,
  type Team,
  type UserProfile,
  type TeamMember,
  type AuthResult,
  type DataAccessScope,
} from './auth.service';

// Calls Service
export {
  CallsService,
  getCallsService,
  callsService,
  type CallMetadata,
  type CallSummary,
  type AgentPerformance,
  type AgentDailyCalls,
} from './calls.service';

// Sessions Service
export {
  SessionsService,
  getSessionsService,
  sessionsService,
  type ChatContext,
  type ChatSessionRow,
  type ChatMessageRow,
  type CreateSessionInput,
  type SaveMessageInput,
  type SessionWithMessages,
  type ClaudeMessage,
} from './sessions.service';

// Transcripts Service
export {
  TranscriptsService,
  getTranscriptsService,
  transcriptsService,
  type TranscriptData,
  type CallTurn,
  type FormattedTranscript,
} from './transcripts.service';

// Search Service
export {
  SearchService,
  getSearchService,
  searchService,
  type SearchOptions,
  type SearchResult,
} from './search.service';

// AI Services
export {
  ClaudeService,
  getClaudeService,
  claudeService,
  type ClaudeResponse,
} from './claude.service';

export {
  EmbeddingsService,
  getEmbeddingsService,
  embeddingsService,
} from './embeddings.service';

export {
  IntentService,
  getIntentService,
  intentService,
  type IntentType,
  type ClassifiedIntent,
} from './intent.service';

// Chat Service
export {
  ChatService,
  getChatService,
  chatService,
  type ChatResponse,
  type UserContext as ChatUserContext,
} from './chat.service';
