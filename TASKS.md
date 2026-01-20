# TASKS.md

## 🎯 Current Focus
Completing Phase 3 (Coaching) and preparing for Phase 5 (Deploy)

---

## 🔥 In Progress

*No tasks currently in progress*

---

## 📋 To Do

### High Priority

- [ ] **Implement Coaching Handler**
  - Description: Add coaching analysis that evaluates calls against a rubric and provides actionable feedback
  - Files: `src/services/chat/handlers/coaching.handler.ts`, `src/prompts/coaching-analysis.ts`
  - Notes: PRD has detailed coaching prompt template to use

- [ ] **Fix Team Summary Response**
  - Description: Database returns different columns than the response formatter expects
  - Files: `src/services/chat/handlers/team-summary.handler.ts`, `src/services/chat/response.formatter.ts`
  - Notes: Need to inspect actual RPC response and align

- [ ] **Update PROGRESS.md with Session 2**
  - Description: Log the frontend build session
  - Files: `PROGRESS.md`

### Medium Priority

- [ ] **Add Session/Conversation History**
  - Description: Persist chat history so users can have contextual follow-up questions
  - Approach: Store in Supabase or implement in-memory session store
  - Dependencies: May need new database table

- [ ] **Add Objection Analysis Handler**
  - Description: Detect and analyze objections in calls, evaluate agent responses
  - Files: `src/prompts/objection-analysis.ts`, new handler file

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
| Team summary formatting | Returns different columns than expected | Response still works but not optimal formatting |
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

- [ ] Set up production environment variables
- [ ] Configure deployment platform (Vercel/Railway)
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
