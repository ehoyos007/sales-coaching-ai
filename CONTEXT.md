# CONTEXT.md

> Extended context and background information for the Sales Coaching AI project.

## Project Overview

**Name:** Sales Coaching AI
**Description:** AI-powered sales coaching chat interface for analyzing agent call data at First Health Enrollment. Replaces manual call review with an intelligent chat interface that surfaces agent performance data, finds specific call patterns, and provides coaching feedback.

**Repository:** [TBD - Add GitHub URL]
**Production URL:** [TBD - Not yet deployed]

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime environment |
| TypeScript | 5.3.3 | Type-safe JavaScript |
| Express.js | 4.18.2 | Web framework |
| Supabase | 2.39.0 | PostgreSQL database + pgvector |
| Anthropic Claude | 0.17.0 | Intent classification + response generation |
| OpenAI | 4.24.0 | Text embeddings for semantic search |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.3 | Type-safe JavaScript |
| Vite | 5.0.10 | Build tool and dev server |
| Tailwind CSS | 3.4.0 | Utility-first CSS |
| react-markdown | 9.0.1 | Markdown rendering in chat |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | Hosted PostgreSQL with pgvector extension |
| [TBD] | Deployment platform (Vercel/Railway) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Chat   │  │ Sidebar │  │  Hooks   │  │ API Service  │  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └──────┬───────┘  │
│       └────────────┴────────────┴───────────────┘           │
│                           │ HTTP                             │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API Routes                         │   │
│  │  /chat  /agents  /calls  /search  /team              │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Chat Service (Orchestrator)           │   │
│  │  1. Intent Classification → 2. Handler Routing        │   │
│  │  3. Data Fetching → 4. Response Formatting            │   │
│  └────────────────────────┬─────────────────────────────┘   │
│              ┌────────────┴────────────┐                    │
│              ▼                         ▼                    │
│  ┌───────────────────┐    ┌───────────────────────┐        │
│  │   AI Services     │    │   Database Services   │        │
│  │  - Claude (chat)  │    │  - agents.service     │        │
│  │  - OpenAI (embed) │    │  - calls.service      │        │
│  │  - Intent class.  │    │  - transcripts.svc    │        │
│  └───────────────────┘    │  - search.service     │        │
│                           │  - team.service       │        │
│                           └───────────┬───────────┘        │
└───────────────────────────────────────┼─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
│  ┌─────────┐  ┌───────────────┐  ┌─────────────────────┐   │
│  │ agents  │  │ call_metadata │  │ call_transcript_    │   │
│  │         │  │               │  │ chunks (pgvector)   │   │
│  └─────────┘  └───────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────────────────────────────┐   │
│  │ call_turns  │  │ Database Functions (RPC)            │   │
│  │             │  │ - resolve_agent_name                │   │
│  │             │  │ - get_agent_calls                   │   │
│  │             │  │ - semantic_search_calls             │   │
│  └─────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Patterns & Conventions

### Backend Patterns

1. **Intent-Based Chat Routing**
   - User messages are classified into intents (LIST_CALLS, AGENT_STATS, etc.)
   - Each intent has a dedicated handler in `src/services/chat/handlers/`
   - Handlers return structured data, then formatted into natural language

2. **Service Layer Architecture**
   - Database services wrap Supabase queries (`src/services/database/`)
   - AI services wrap external APIs (`src/services/ai/`)
   - Clear separation between data access and business logic

3. **Type-First Development**
   - All entities have TypeScript interfaces in `src/types/`
   - Barrel exports via `index.ts` files

4. **Prompt Engineering**
   - Prompts stored in `src/prompts/` as template strings
   - Separated from business logic for easy iteration

### Frontend Patterns

1. **Custom Hooks for State**
   - `useChat` - Chat messages and sending
   - `useAgents` - Agent data fetching
   - `useCalls` - Call details and transcripts

2. **Component Organization**
   - Feature-based folders (Chat/, Sidebar/, CallDetails/)
   - Barrel exports for clean imports
   - Presentational + container pattern

3. **Tailwind CSS**
   - Utility-first styling
   - Custom color palette (primary-50 through primary-900)
   - Responsive design with mobile-first approach

---

## Database Schema (Existing in Supabase)

### Tables
| Table | Description |
|-------|-------------|
| `agents` | Sales agent profiles (agent_user_id, first_name, email, department) |
| `call_metadata` | Call records with duration, talk ratios, transcripts |
| `call_transcript_chunks` | Chunked transcripts with pgvector embeddings |
| `call_turns` | Individual turns in conversations (speaker, text, timestamps) |

### Key Database Functions
| Function | Purpose |
|----------|---------|
| `resolve_agent_name(name)` | Fuzzy match agent name to ID |
| `get_agent_calls(agent_id, dates)` | Get agent's calls with filtering |
| `get_agent_performance(agent_id, dates)` | Performance metrics |
| `get_team_summary(department, dates)` | Team-wide statistics |
| `semantic_search_calls(embedding, filters)` | Vector similarity search |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key (embeddings) | Yes |
| `CLIENT_URL` | Frontend URL for CORS | No |

---

## Intent Types

| Intent | Description | Example Query |
|--------|-------------|---------------|
| `LIST_CALLS` | View agent's calls | "Show me Bradley's calls" |
| `AGENT_STATS` | Performance metrics | "How is Bradley doing?" |
| `TEAM_SUMMARY` | Team-wide stats | "Team performance this week" |
| `GET_TRANSCRIPT` | View specific call | "Show me call ABC123" |
| `SEARCH_CALLS` | Semantic search | "Find calls with price objections" |
| `COACHING` | Coaching feedback | "Give me coaching tips for this call" |
| `GENERAL` | Greetings, help | "Hello" / "What can you do?" |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/chat` | Main chat interface |
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/:id/calls` | Agent's calls |
| GET | `/api/v1/agents/:id/performance` | Agent metrics |
| GET | `/api/v1/calls/:id` | Call details |
| GET | `/api/v1/calls/:id/transcript` | Call transcript |
| POST | `/api/v1/search` | Semantic search |
| GET | `/api/v1/team/summary` | Team summary |

---

## User Context

### Target Users
**Sales Managers at First Health Enrollment**
- Need to review agent performance quickly
- Want to identify coaching opportunities
- Analyze call patterns across the team

### User Flows
1. **Quick Performance Check**: Ask about an agent → See stats → Drill into specific calls
2. **Call Review**: Search for calls by topic → View transcript → Get coaching feedback
3. **Team Overview**: Request team summary → Identify top/bottom performers

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

---

**Last Updated:** 2026-01-20
