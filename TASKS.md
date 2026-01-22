# TASKS.md

## 🎯 Current Focus
Dashboard pages deployed, ready for production testing

---

## 🔥 In Progress

*No tasks currently in progress*

---

## 📋 To Do

### High Priority

*No high priority tasks at this time*

### Medium Priority

- [ ] **Add Unit Tests for Dashboard Services**
  - Description: Test dashboard, compliance, goals services
  - Coverage: Aggregation logic, RPC function calls

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

### Session 37 (2026-01-21)
- [x] Fixed loading screen centering issue
  - Root cause: `#root` has `display: flex`, loading divs needed `flex-1` to fill container
  - Added `flex-1` class to loading screens in `ProtectedRoute.tsx` and `LoginPage.tsx`
- [x] Fixed Team Overview navigation link not showing
  - Root cause: Users don't have `teamId` set in their profile
  - Sidebar now fetches available teams for admin/manager users without teamId
  - Uses first available team for the Team Overview link
  - Files: `Sidebar.tsx`
- [x] Fixed Team Overview page crash (UUID type error)
  - Root cause: Supabase JS client passes strings, but SQL functions expected UUID type
  - Error: `operator does not exist: uuid = text`
  - Created migration to change `p_team_id` from UUID to TEXT in RPC functions
  - Functions fixed: `get_team_overview_metrics`, `get_agent_overview_metrics`, `get_call_volume_trend`, `get_goals_progress`, `get_objection_summary`
  - Migration: `20260124000000_fix_dashboard_uuid_params.sql`
  - **ACTION REQUIRED**: Apply migration to Supabase production database

### Session 36 (2026-01-21)
- [x] Granted Admin role to yjulian@firsthealthenroll.org
  - Modified database constraint to allow multiple admins
  - Updated user role from 'manager' to 'admin'
  - Database: Modified `check_admin_constraint()` function, updated `user_profiles` table

### Session 35 (2026-01-21)
- [x] Added admin role switcher for testing/debugging
  - New RoleSwitcher component in sidebar footer (admin-only)
  - localStorage-based role simulation (Manager/Agent views)
  - Page reloads on role change, DEV badge when active
  - Files: `RoleSwitcher.tsx`, `AuthContext.tsx`, `Sidebar.tsx`

### Session 34 (2026-01-21)
- [x] Added navigation accessibility for Team Overview and Agent Overview pages
  - Added "Team Overview" link in sidebar for managers (shows when team is assigned)
  - Added "My Performance" link in sidebar for agents
  - Team Overview → Agent Detail navigation already existed (click agent row)
  - File: `client/src/components/Sidebar/Sidebar.tsx`

### Session 33 (2026-01-21)
- [x] Fixed manager data scoping issues
  - Agent name resolution now scoped to accessible agents only
  - Helpful error message when agent not found in team
  - Admin Panel button visible to managers in Sidebar
  - Files: `agents.service.ts`, `chat.service.ts`, `Sidebar.tsx`

### Session 32 (2026-01-21)
- [x] Fixed dashboard 500 errors and navigation
  - Fixed SQL GROUP BY error in `get_agent_overview_metrics` RPC function
  - Restructured team_comparison query using CTEs
  - Removed broken "My Performance" link from Sidebar (used wrong ID type)
  - Deployed fixes to Supabase (SQL) and Vercel (frontend)
  - Files: `20260122000001_add_dashboard_tables.sql`, `Sidebar.tsx`

### Session 31 (2026-01-21)
- [x] Fixed authentication UX issues
  - Debugged and fixed account creation button (pointer-events on blur div)
  - Troubleshot "Email not confirmed" error — disabled email confirmation in Supabase
  - Implemented auto-login after successful registration
  - Files: `LoginPage.tsx`, `AuthContext.tsx`

### Session 30 (2026-01-21)
- [x] **Team Overview & Agent Overview Dashboard Pages** — Full implementation + production deployment
  - Database: Created `compliance_scores`, `agent_goals` tables with 6 RPC functions
  - Backend: Dashboard, compliance, goals services + controller + routes
  - Frontend: Installed Recharts, created 10 dashboard components
  - Team Overview: Summary cards, agent breakdown table, trend/bar/donut charts
  - Agent Overview: Performance metrics, team comparison, charts, goals progress
  - Navigation: Routes `/teams/:teamId/overview`, `/agents/:agentId/overview`
  - Migration applied to Supabase production
  - Deployed to Railway (backend) and Vercel (frontend)

### Session 29 (2026-01-21)
- [x] Fixed account creation button not responding to clicks
  - Bug: Decorative blur overlay was intercepting pointer events
  - Fix: Added `pointer-events-none` to blur div on submit button
  - File: `client/src/pages/Login/LoginPage.tsx`

### Session 28 (2026-01-21)
- [x] Fixed objection analysis to display verbatim snippets
  - Bug: Formatter was short-circuiting to return summary, skipping structured analysis
  - Fix: Always render structured analysis with Customer/Agent quotes, append summary at end
  - Deployed to Railway production

### Session 27 (2026-01-21)
- [x] Fixed Admin Panel team management issues
  - Added Delete Team button with confirmation dialog to edit modal
  - Investigated Invite User button (intentional placeholder for future feature)
  - Fixed agent-to-team assignment to use `agents` table instead of `user_profiles`
  - Created migration to add `team_id` column to agents table
  - Added backend endpoints: GET /admin/agents, PUT /admin/agents/:agentUserId/team
  - Updated TeamList to display and manage sales agents from agents table

### Session 26 (2026-01-21)
- [x] Enhanced objection analysis with verbatim snippets and pattern tracking
  - Created `agent_objection_stats` and `objection_occurrences` database tables
  - Added RPC functions for recording and querying objection stats
  - Created `agent-objection-stats.service.ts` with non-blocking recording
  - Enhanced prompts for verbatim snippet extraction from transcripts
  - Pattern-aware coaching summaries using agent's historical weak/strong areas
  - Updated response formatter to display Customer/Agent quote format
  - Applied migration to Supabase production

### Session 25 (2026-01-21)
- [x] Completed Sales Scripts Management feature deployment
  - Database migration verified (sales_scripts, rubric_sync_log tables)
  - Created sales-scripts storage bucket in Supabase
  - Backend: File upload, PDF/DOCX parsing, AI sync workflow
  - Frontend: ScriptsManager, ScriptUploadWizard, SyncReviewPanel components
  - New "Sales Scripts" tab in Rubric Settings
  - API endpoints for script CRUD and rubric sync

### Session 24 (2026-01-21)
- [x] Added team-centric agent management to Admin Panel
  - New `onUpdateMember` prop in TeamList for member assignment
  - Team Members section in Edit Team modal
  - Dropdown to add available agents to team
  - Member list with Remove button for each agent
  - Loading states on add/remove operations
  - Empty state message when team has no agents

### Session 22 (2026-01-21)
- [x] Added loading states throughout the application
  - UserMenu: Sign out button shows spinner and "Signing out..." text
  - QuickActions: Buttons disabled during chat loading
  - VersionHistory: Restore button shows "Restoring..." with spinner
  - RubricSettings: Create draft modal shows loading state
  - AgentList: Agent selection buttons disabled during chat loading
  - All buttons have proper `disabled` and `aria-busy` attributes for accessibility

### Session 21 (2026-01-21)
- [x] Improved error messages across all chat handlers
  - Created centralized `src/utils/error-messages.ts` utility
  - Added ErrorMessages object with user-friendly messages and suggestions
  - Added buildErrorMessage() for classifying and formatting errors
  - Updated all 7 handlers to use consistent error handling
  - Empty states now include actionable suggestions
  - Technical errors hidden from users, logged for debugging

### Session 19 (2026-01-20)
- [x] Set up Sentry error tracking for backend and frontend
  - Backend: @sentry/node, error middleware integration, user context
  - Frontend: @sentry/react, ErrorBoundary, API error capture
  - Added SENTRY_DSN and VITE_SENTRY_DSN environment variables
  - Session replay enabled for debugging

### Session 16 (2026-01-20)
- [x] Implemented full authentication system with RBAC
  - Auth service with Supabase Auth integration
  - Middleware for authentication, authorization, data scoping
  - Domain restriction (@firsthealthenroll.org only)
  - Role-based access: Admin, Manager, Agent
  - Data scoping: Agent=own calls, Manager=team calls, Admin=all
  - Frontend: Login page, protected routes, user menu, admin panel
  - Fixed RLS issues with service role key
  - Fixed CORS for multiple dev ports

### Session 15 (2026-01-20)
- [x] Tested coaching analysis with dynamic rubric end-to-end
- [x] Verified rubric config ID and version returned in coaching response
- [x] Confirmed all 6 categories, weights, and scoring criteria working

### Session 13-14 (2026-01-20)
- [x] Manager Configuration Panel (Phase 6) fully implemented
  - Database migrations for rubric config tables
  - REST API endpoints for rubric CRUD operations
  - Frontend settings page with category weights, scoring criteria, red flags editors
  - Version history with restore functionality
  - Dynamic coaching prompt builder
  - Deployed to production (Railway + Vercel)

### Session 12 (2026-01-20)
- [x] Added Objection Analysis Handler
  - New intent type: `OBJECTION_ANALYSIS`
  - New prompt file: `src/prompts/objection-analysis.ts`
  - New handler: `src/services/chat/handlers/objection-analysis.handler.ts`
  - Updated intent classification, handler registry, response formatter

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
- [x] Configure error tracking (Sentry)
- [ ] Set up logging (Logtail/Datadog)
- [x] Add authentication
- [ ] Security review (CORS, rate limiting)
- [ ] Performance testing
- [ ] Update README with deployment instructions

---

**Last Updated:** 2026-01-21 (Session 36)
