# Sales Coaching Chat AI - Product Requirements Document

## Project Overview

Build a full-stack web application that enables sales managers at First Health Enrollment to query, analyze, and coach sales agents using AI-powered conversation with embedded call transcript data stored in Supabase.

### Core Value Proposition
Replace manual call review with an intelligent chat interface that can instantly surface agent performance data, find specific call patterns, and provide coaching feedback.

---

## Technical Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Embeddings**: OpenAI text-embedding-3-small (for semantic search)

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Context (or Zustand if needed)
- **HTTP Client**: fetch or axios

### Infrastructure
- **Deployment**: Vercel, Railway, or similar
- **Environment**: dotenv for configuration

---

## Existing Database Schema (Supabase)

The following tables already exist and are populated with data:

### `agents` table
```sql
agent_user_id TEXT PRIMARY KEY  -- UUID as text
first_name TEXT NOT NULL
email TEXT UNIQUE
department TEXT                  -- "Agent" or "CS Dept"
extension TEXT
active BOOLEAN DEFAULT true
admin BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

### `call_metadata` table
```sql
call_id TEXT PRIMARY KEY
agent_user_id TEXT               -- FK to agents
lead_id TEXT
call_date DATE                   -- YYYY-MM-DD
call_datetime TIMESTAMPTZ
department TEXT
total_duration_seconds NUMERIC
total_duration_formatted TEXT    -- "MM:SS"
total_turns INT
agent_turns INT
customer_turns INT
agent_talk_percentage NUMERIC
customer_talk_percentage NUMERIC
full_transcript TEXT
agent_only_transcript TEXT
customer_only_transcript TEXT
is_inbound_call BOOLEAN
is_redacted BOOLEAN
```

### `call_transcript_chunks` table (for semantic search)
```sql
id SERIAL PRIMARY KEY
call_id TEXT                     -- FK to call_metadata
agent_user_id TEXT
chunk_number INT
total_chunks INT
chunk_text TEXT
embedding VECTOR(1536)           -- OpenAI embedding
call_date DATE
start_timestamp_formatted TEXT
end_timestamp_formatted TEXT
speaker_distribution JSONB       -- {"agent": N, "customer": M}
contains_agent_speech BOOLEAN
contains_customer_speech BOOLEAN
```

### `call_turns` table
```sql
id SERIAL PRIMARY KEY
call_id TEXT
agent_user_id TEXT
turn_number INT
speaker TEXT                     -- "Agent" or "Customer"
text TEXT
timestamp_start TEXT
timestamp_end TEXT
duration_seconds NUMERIC
```

### Existing Database Functions
```sql
resolve_agent_name(p_name TEXT)
get_agent_calls(p_agent_user_id TEXT, p_start_date DATE, p_end_date DATE, p_limit INT)
get_agent_performance(p_agent_user_id TEXT, p_start_date DATE, p_end_date DATE)
get_call_transcript(p_call_id TEXT)
get_team_summary(p_department TEXT, p_start_date DATE, p_end_date DATE)
get_agent_daily_calls(p_agent_user_id TEXT, p_start_date DATE, p_end_date DATE)
semantic_search_calls(query_embedding VECTOR, p_agent_user_id TEXT, p_start_date DATE, p_end_date DATE, p_limit INT, similarity_threshold FLOAT)
```

---

## Core Features

### Phase 1: Foundation (MVP)

#### 1.1 Chat Interface
- Clean, minimal chat UI
- Message input with send button
- Scrollable message history
- Loading indicators during AI processing
- Markdown rendering for AI responses

#### 1.2 Intent Classification
The system must classify user messages into these intents:
- `LIST_CALLS` - User wants to see a list of calls
- `AGENT_STATS` - User wants performance metrics
- `TEAM_SUMMARY` - User wants team-wide statistics
- `GET_TRANSCRIPT` - User wants to view a specific call
- `SEARCH_CALLS` - User wants to find calls by content (semantic search)
- `COACHING` - User wants coaching feedback on a call
- `GENERAL` - Greetings, help requests, general questions

#### 1.3 Agent Name Resolution
- Fuzzy match agent names to agent_user_id
- Handle partial matches ("Brad" → "Bradley")
- Handle ambiguous matches (show options if multiple)

#### 1.4 Structured Queries
Implement handlers for:
- List agent's calls with date filtering
- Get agent performance summary
- Get team summary by department
- Get full call transcript by call_id

### Phase 2: Semantic Search

#### 2.1 Query Embedding
- Convert user's search query to embedding via OpenAI
- Call `semantic_search_calls()` function
- Return relevant transcript chunks with similarity scores

#### 2.2 Search Use Cases
- "Find calls where customers objected to price"
- "Show me calls with strong closes"
- "Find calls where the customer mentioned Medicare"

### Phase 3: Coaching & Analysis

#### 3.1 Call Coaching
- Retrieve full transcript for a specific call
- Analyze against coaching rubric
- Provide structured feedback with:
  - Overall score (1-5)
  - Strengths with examples
  - Areas for improvement with specific tips
  - Actionable next steps

#### 3.2 Objection Analysis
- Identify objections in calls
- Extract agent's rebuttal/response
- Evaluate effectiveness
- Suggest better approaches

---

## API Design

### Base URL
```
/api/v1
```

### Endpoints

#### POST /api/v1/chat
Main chat endpoint for all interactions.

**Request:**
```json
{
  "message": "Show me Bradley's calls from last week",
  "session_id": "optional-session-id",
  "context": {
    "agent_user_id": "optional-pre-selected-agent",
    "call_id": "optional-current-call-context"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Here are Bradley's calls from the last 7 days...",
  "data": {
    "type": "call_list",
    "calls": [...],
    "agent": {...}
  },
  "intent": "LIST_CALLS",
  "timestamp": "2026-01-20T10:30:00Z"
}
```

#### GET /api/v1/agents
List all active agents.

**Response:**
```json
{
  "agents": [
    {
      "agent_user_id": "xxx",
      "first_name": "Bradley",
      "email": "bvazquez@...",
      "department": "Agent",
      "total_calls": 147
    }
  ]
}
```

#### GET /api/v1/agents/:agentId/calls
Get calls for a specific agent.

**Query Params:**
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `limit` - max results (default 50)

#### GET /api/v1/agents/:agentId/performance
Get performance summary for an agent.

**Query Params:**
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD

#### GET /api/v1/calls/:callId
Get full call details including transcript.

#### GET /api/v1/calls/:callId/transcript
Get just the transcript (formatted or raw).

#### POST /api/v1/calls/:callId/coaching
Generate coaching feedback for a call.

**Request:**
```json
{
  "focus_areas": ["objection_handling", "closing"],
  "detail_level": "detailed"
}
```

#### POST /api/v1/search
Semantic search across transcripts.

**Request:**
```json
{
  "query": "customer objected to monthly premium",
  "agent_user_id": "optional-filter",
  "start_date": "2026-01-01",
  "end_date": "2026-01-20",
  "limit": 10
}
```

#### GET /api/v1/team/summary
Get team-wide performance summary.

**Query Params:**
- `department` - "Agent" or "CS Dept"
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD

---

## Project Structure

```
sales-coaching-ai/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   │
│   ├── config/
│   │   ├── index.ts             # Config loader
│   │   └── database.ts          # Supabase client
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── chat.routes.ts       # POST /chat
│   │   ├── agents.routes.ts     # /agents endpoints
│   │   ├── calls.routes.ts      # /calls endpoints
│   │   ├── search.routes.ts     # /search endpoint
│   │   └── team.routes.ts       # /team endpoints
│   │
│   ├── controllers/
│   │   ├── chat.controller.ts
│   │   ├── agents.controller.ts
│   │   ├── calls.controller.ts
│   │   ├── search.controller.ts
│   │   └── team.controller.ts
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── claude.service.ts      # Claude API wrapper
│   │   │   ├── intent.service.ts      # Intent classification
│   │   │   ├── coaching.service.ts    # Coaching analysis
│   │   │   └── embeddings.service.ts  # OpenAI embeddings
│   │   │
│   │   ├── database/
│   │   │   ├── agents.service.ts
│   │   │   ├── calls.service.ts
│   │   │   ├── transcripts.service.ts
│   │   │   └── search.service.ts
│   │   │
│   │   └── chat/
│   │       ├── chat.service.ts        # Main chat orchestrator
│   │       ├── handlers/
│   │       │   ├── list-calls.handler.ts
│   │       │   ├── agent-stats.handler.ts
│   │       │   ├── team-summary.handler.ts
│   │       │   ├── get-transcript.handler.ts
│   │       │   ├── search-calls.handler.ts
│   │       │   ├── coaching.handler.ts
│   │       │   └── general.handler.ts
│   │       └── response.formatter.ts
│   │
│   ├── prompts/
│   │   ├── intent-classification.ts
│   │   ├── response-formatting.ts
│   │   ├── coaching-analysis.ts
│   │   └── objection-analysis.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── agent.types.ts
│   │   ├── call.types.ts
│   │   ├── chat.types.ts
│   │   └── intent.types.ts
│   │
│   ├── utils/
│   │   ├── date.utils.ts
│   │   ├── format.utils.ts
│   │   └── validation.utils.ts
│   │
│   └── middleware/
│       ├── error.middleware.ts
│       ├── logging.middleware.ts
│       └── cors.middleware.ts
│
├── client/                       # React frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatContainer.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── ChatHeader.tsx
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── AgentList.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   │
│   │   │   ├── CallDetails/
│   │   │   │   ├── CallDetailsModal.tsx
│   │   │   │   ├── TranscriptViewer.tsx
│   │   │   │   └── CallMetrics.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       └── DateRangePicker.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── useAgents.ts
│   │   │   └── useCalls.ts
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   └── public/
│       └── favicon.ico
│
└── scripts/
    └── seed-test-data.ts
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## Key Implementation Details

### Intent Classification Prompt

```typescript
const INTENT_CLASSIFICATION_PROMPT = `
You are an intent classifier for a sales coaching AI at First Health Enrollment.

Classify this user message and extract relevant parameters.

User message: "{message}"

Classify into ONE of these intents:
- LIST_CALLS: User wants to see a list of calls (e.g., "show me calls", "Bradley's calls")
- AGENT_STATS: User wants performance metrics (e.g., "how is Bradley doing", "performance summary")
- TEAM_SUMMARY: User wants team-wide stats (e.g., "team performance", "how's the sales team")
- GET_TRANSCRIPT: User wants to see a specific call transcript (references a call_id)
- SEARCH_CALLS: User wants to find calls by content (e.g., "find calls where customer objected")
- COACHING: User wants coaching feedback on a call (e.g., "coaching tips", "how could they improve")
- GENERAL: General question, greeting, or help request

Extract these parameters if present:
- agent_name: First name of agent mentioned (null if none)
- days_back: Time range in days (default 7)
- call_id: Specific call ID if mentioned (null if none)
- search_query: What to search for if SEARCH_CALLS intent (null otherwise)

Respond ONLY with valid JSON:
{
  "intent": "INTENT_NAME",
  "agent_name": null | "Name",
  "days_back": 7,
  "call_id": null | "call-id-string",
  "search_query": null | "search query string",
  "confidence": 0.0-1.0
}
`;
```

### Coaching Analysis Prompt

```typescript
const COACHING_ANALYSIS_PROMPT = `
You are an expert sales coach for health insurance agents at First Health Enrollment.

Analyze this sales call transcript and provide coaching feedback.

## Context
- Agent: {agent_name}
- Call Date: {call_date}
- Duration: {duration}
- Talk Ratio: Agent {agent_pct}% / Customer {customer_pct}%

## Transcript
{full_transcript}

## Evaluation Criteria

Score each area 1-5:

1. **Opening & Introduction**
   - Clear introduction and rapport building
   - Set expectations for the call

2. **Needs Discovery**
   - Asked about current coverage
   - Uncovered pain points
   - Listened more than talked

3. **Product Presentation**
   - Presented relevant options
   - Explained benefits clearly
   - Checked for understanding

4. **Objection Handling**
   - Acknowledged concerns
   - Addressed objections effectively
   - Used appropriate techniques

5. **Closing**
   - Used trial closes
   - Asked for the sale
   - Handled close professionally

## Response Format

Provide:
1. **Overall Score**: X/5
2. **Strengths** (3 items with specific examples from the call)
3. **Areas for Improvement** (3 items with coaching tips)
4. **Recommended Focus**: One actionable next step

Keep feedback constructive and specific.
`;
```

### Chat Service Flow

```typescript
// Simplified flow in chat.service.ts

async function processMessage(message: string, context?: ChatContext) {
  // 1. Classify intent
  const intent = await intentService.classify(message);
  
  // 2. Resolve agent if mentioned
  let agentId = context?.agent_user_id;
  if (intent.agent_name && !agentId) {
    const agent = await agentsService.resolveByName(intent.agent_name);
    if (!agent) {
      return formatResponse("I couldn't find an agent named " + intent.agent_name);
    }
    agentId = agent.agent_user_id;
  }
  
  // 3. Route to appropriate handler
  const handler = getHandler(intent.intent);
  const data = await handler.execute({
    agentId,
    daysBack: intent.days_back,
    callId: intent.call_id,
    searchQuery: intent.search_query
  });
  
  // 4. Format response with Claude
  const response = await responseFormatter.format(intent.intent, data, message);
  
  return {
    success: true,
    response,
    data,
    intent: intent.intent
  };
}
```

---

## UI/UX Requirements

### Chat Interface
- Full-height chat container with scrollable messages
- User messages aligned right (blue bubble)
- AI messages aligned left (gray bubble, supports markdown)
- Typing indicator while AI is processing
- Timestamp on messages

### Sidebar (Optional)
- List of agents with quick select
- Recent conversations
- Quick action buttons ("Team Summary", "My Calls")

### Call Details Modal
- Opens when clicking a call in the chat
- Shows full transcript with speaker labels
- Metrics panel (duration, talk ratio, turns)
- "Get Coaching" button

### Responsive Design
- Desktop: Sidebar + Chat
- Mobile: Full-width chat, collapsible sidebar

---

## Success Metrics

1. **Response Time**: < 3 seconds for structured queries, < 10 seconds for coaching analysis
2. **Intent Accuracy**: > 95% correct classification
3. **Agent Resolution**: > 99% successful name-to-ID matching
4. **User Satisfaction**: Qualitative feedback from sales managers

---

## Development Phases

### Phase 1: Backend Foundation (Week 1)
- [ ] Project setup (TypeScript, Express, Supabase client)
- [ ] Database service layer (agents, calls, transcripts)
- [ ] Intent classification service
- [ ] Basic chat endpoint with LIST_CALLS and AGENT_STATS
- [ ] Response formatting

### Phase 2: Full Chat Features (Week 2)
- [ ] All intent handlers implemented
- [ ] Semantic search with embeddings
- [ ] Team summary functionality
- [ ] Error handling and validation

### Phase 3: Coaching & Analysis (Week 3)
- [ ] Coaching analysis prompts
- [ ] Objection detection
- [ ] Structured coaching feedback
- [ ] Call comparison features

### Phase 4: Frontend (Week 4)
- [ ] React app setup
- [ ] Chat interface components
- [ ] API integration
- [ ] Markdown rendering
- [ ] Call details modal

### Phase 5: Polish & Deploy (Week 5)
- [ ] UI refinements
- [ ] Performance optimization
- [ ] Deployment setup
- [ ] Documentation

---

## Getting Started

```bash
# Clone and install
git clone <repo>
cd sales-coaching-ai
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Run frontend (in separate terminal)
cd client
npm install
npm run dev
```

---

## Notes for Claude Code

1. **Database is already set up** - Don't create tables, just connect to existing Supabase
2. **Functions exist** - Use the existing PostgreSQL functions (resolve_agent_name, get_agent_calls, etc.)
3. **Start with backend** - Get API working before building frontend
4. **Test with curl** - Verify each endpoint before moving on
5. **Use TypeScript** - Strong typing throughout
6. **Keep prompts in separate files** - Easy to iterate on prompt engineering
