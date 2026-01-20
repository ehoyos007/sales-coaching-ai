# TASKS.md

## 🎯 Current Focus
Preparing for deployment and adding polish features

---

## 🔥 In Progress

*No tasks currently in progress*

---

## 📋 To Do

### High Priority

- [ ] **Run database migration for conversation history**
  - Description: Execute the migration in Supabase SQL Editor
  - File: `supabase/migrations/20260120000000_add_chat_history.sql`
  - Status: Code complete, awaiting migration execution

### Medium Priority

- [ ] **Add Objection Analysis Handler**
  - Description: Detect and analyze objections in calls, evaluate agent responses
  - Files: `src/prompts/objection-analysis.ts`, new handler file

- [ ] **Manager Configuration Panel (Phase 6)**
  - Description: UI for managers to customize coaching rubric weights and criteria
  - Files: New frontend components, new API endpoints
  - Notes: See PLAN.md for data model design

- [ ] **Improve Error Messages**
  - Description: More user-friendly error messages when agent not found, no data, etc.
  - Files: `src/services/chat/handlers/*.ts`

- [ ] **Add Loading States to Sidebar**
  - Description: Show skeleton loaders while agents are loading
  - Files: `client/src/components/Sidebar/AgentList.tsx`

### Low Priority / Backlog

- [ ] **Add Date Range Picker Component**
  - Description: Allow users to select custom date ranges for queries
  - Files: `client/src/components/common/DateRangePicker.tsx`

- [ ] **Implement Call Comparison**
  - Description: Compare performance between two agents or two calls
  - Notes: Would need new intent type and handler

- [ ] **Add Export to PDF**
  - Description: Export coaching reports or call transcripts to PDF
  - Dependencies: Need PDF generation library

- [ ] **Add Keyboard Shortcuts**
  - Description: Cmd+K to focus chat, Esc to clear, etc.
  - Files: `client/src/App.tsx`, `client/src/components/Chat/ChatInput.tsx`

---

## ✅ Done

### Session 8 (2026-01-20)
- [x] Added session/conversation history support
- [x] Created database migration for chat_sessions and chat_messages tables
- [x] Added backend types and sessions service
- [x] Updated chat service to save messages to database
- [x] Added history API endpoint
- [x] Updated frontend to persist sessionId and load history
- [x] Added "New Chat" button to start fresh conversations

### Session 7 (2026-01-20)
- [x] Updated TASKS.md to reflect current project status
- [x] Fixed team summary response formatting (aligned formatter with actual RPC response)
- [x] Deployed to production (Vercel + Railway)

### Session 6 (2026-01-20)
- [x] Designed and implemented coaching rubric with 6 scoring categories
- [x] Created coaching analysis prompts
- [x] Implemented coaching handler with rubric-based analysis
- [x] Added coaching response formatter with score breakdown
- [x] Fixed get-transcript handler transcript.turns parsing
- [x] Updated PLAN.md with Phase 6 (Manager Configuration Panel)

### Session 5 (2026-01-20)
- [x] Fixed transcript data not displaying (field name mismatch)
- [x] Added parseTranscriptText() to convert full_transcript to CallTurn[]
- [x] Fixed modal scroll with min-h-0 on flex containers

### Session 4 (2026-01-20)
- [x] Fixed TranscriptViewer crash (null-safe access for turns array)

### Session 3 (2026-01-20)
- [x] Created project documentation (CONTEXT.md, PLAN.md, TASKS.md)
- [x] Verified full-stack application runs correctly
- [x] Committed and pushed all changes

### Session 2 (2026-01-20)
- [x] Set up React frontend with Vite, TypeScript, Tailwind CSS
- [x] Build Chat components (ChatContainer, ChatMessage, ChatInput, ChatHeader)
- [x] Build Sidebar components (Sidebar, AgentList, QuickActions)
- [x] Build CallDetails components (Modal, TranscriptViewer, CallMetrics)
- [x] Build common components (LoadingSpinner, MarkdownRenderer)
- [x] Create custom hooks (useChat, useAgents, useCalls)
- [x] Create API service layer
- [x] Wire up App.tsx with all components
- [x] Verify build passes

### Session 1 (2026-01-20)
- [x] Project initialization (package.json, tsconfig.json)
- [x] Core configuration layer (environment variables, Supabase client)
- [x] Type definitions (Agent, Call, Chat, Intent types)
- [x] Database service layer (agents, calls, transcripts, team, search)
- [x] AI services (Claude for chat/intent, OpenAI for embeddings)
- [x] Intent classification with Claude
- [x] Chat handlers (LIST_CALLS, AGENT_STATS, TEAM_SUMMARY, GET_TRANSCRIPT, SEARCH_CALLS, GENERAL)
- [x] Response formatter for natural language responses
- [x] Express API routes and controllers
- [x] Middleware (error handling, request logging)

---

## 🐛 Known Issues

| Issue | Description | Workaround |
|-------|-------------|------------|
| Port conflict | Backend uses 3001 instead of 3000 | Intentional - 3000 was in use |

---

## 💡 Ideas / Future Enhancements

- [ ] Real-time call monitoring integration
- [ ] Agent self-service coaching portal
- [ ] Slack/Teams integration for notifications
- [ ] Weekly performance digest emails
- [ ] Voice playback of calls (if audio available)
- [ ] A/B testing for coaching prompts
- [ ] Gamification (leaderboards, badges)

---

## 🚀 Deployment Checklist

- [x] Set up production environment variables
- [x] Configure deployment platform (Vercel/Railway)
- [ ] Set up CI/CD pipeline
- [ ] Add health check endpoint monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up logging (Logtail/Datadog)
- [ ] Add authentication
- [ ] Security review (CORS, rate limiting)
- [ ] Performance testing
- [ ] Update README with deployment instructions

---

**Last Updated:** 2026-01-20
