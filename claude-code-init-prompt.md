# Claude Code Initialization Prompt

Copy and paste this into Claude Code to initialize the project:

---

## Prompt:

I want to build a Sales Coaching Chat AI application. I have a detailed PRD in the file `sales-coaching-ai-prd.md` that describes the full project.

**Important context:**
- The Supabase database already exists with tables: `agents`, `call_metadata`, `call_transcript_chunks`, and `call_turns`
- PostgreSQL functions already exist: `resolve_agent_name()`, `get_agent_calls()`, `get_agent_performance()`, `get_call_transcript()`, `get_team_summary()`, `get_agent_daily_calls()`, `semantic_search_calls()`
- I need a Node.js/TypeScript backend with Express
- I need a React/TypeScript frontend with Tailwind CSS
- The main feature is a chat interface where users can ask questions like "Show me Bradley's calls" or "How is the sales team doing?"

**Please start by:**
1. Reading the PRD file completely
2. Initializing the project structure as outlined in the PRD
3. Setting up the backend with TypeScript, Express, and Supabase client
4. Creating the database service layer that calls the existing Supabase functions
5. Implementing the intent classification service with Claude
6. Building the main /api/v1/chat endpoint

Start with the backend - we'll build the frontend after the API is working.

---

## After Initialization, Test With:

```bash
# Start the server
npm run dev

# Test the chat endpoint
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me Bradley calls from last week"}'

# Test agent resolution
curl http://localhost:3000/api/v1/agents

# Test specific agent
curl "http://localhost:3000/api/v1/agents/9ec1296e-2553-4f09-9781-0fb064dfae29/calls?start_date=2026-01-13&end_date=2026-01-20"
```

---

## Key Files to Reference

1. **PRD**: `sales-coaching-ai-prd.md` - Full project specification
2. **Env Example**: `env.example` - Required environment variables
3. **SQL Functions**: Already in Supabase, documented in PRD

---

## Credentials You'll Need

Before running, create `.env` with:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key, for RPC calls)
- `ANTHROPIC_API_KEY` - For Claude API
- `OPENAI_API_KEY` - For embeddings (semantic search)
