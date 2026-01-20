# PLAN.md — Sales Coaching AI

> Strategic plan for the Sales Coaching AI development.

## Objective

**Goal:** Build an AI-powered chat interface that enables sales managers to query, analyze, and coach sales agents using embedded call transcript data.

**Success Criteria:**
- [x] Chat interface that understands natural language queries about agents and calls
- [x] Intent classification with >95% accuracy
- [x] Agent name resolution with fuzzy matching
- [x] Semantic search across call transcripts
- [ ] Coaching analysis with actionable feedback
- [ ] Production deployment with <3s response time

---

## Current Phase

### Phase 4: Frontend ✅ COMPLETE

**Status:** Completed on 2026-01-20

The React frontend is fully built with:
- Chat interface with message bubbles, markdown support
- Sidebar with agent list and quick actions
- Call details modal with transcript viewer
- Responsive design (desktop + mobile)

---

## Development Phases

### Phase 1: Backend Foundation ✅ COMPLETE
- [x] Project setup (TypeScript, Express, Supabase client)
- [x] Database service layer (agents, calls, transcripts)
- [x] Intent classification service
- [x] Basic chat endpoint with LIST_CALLS and AGENT_STATS
- [x] Response formatting with Claude

### Phase 2: Full Chat Features ✅ COMPLETE
- [x] All intent handlers implemented
- [x] Semantic search with OpenAI embeddings
- [x] Team summary functionality
- [x] Error handling and validation

### Phase 3: Coaching & Analysis 🔄 PARTIAL
- [ ] Coaching analysis prompts and handler
- [ ] Objection detection in calls
- [ ] Structured coaching feedback (scores, strengths, areas for improvement)
- [ ] Call comparison features

### Phase 4: Frontend ✅ COMPLETE
- [x] React app setup with Vite
- [x] Chat interface components
- [x] API integration with backend
- [x] Markdown rendering for AI responses
- [x] Call details modal with transcript

### Phase 5: Polish & Deploy ⏳ UPCOMING
- [ ] UI refinements based on user feedback
- [ ] Performance optimization
- [ ] Deployment setup (Vercel/Railway)
- [ ] Environment configuration for production
- [ ] Documentation and README

### Phase 6: Manager Configuration Panel 📋 PLANNED
- [ ] Rubric configuration UI for managers
- [ ] Scoring criteria editor (1-5 descriptions per category)
- [ ] Objection handling examples editor (add/edit/remove)
- [ ] Red flag definitions and threshold configuration
- [ ] Category weight adjustments
- [ ] Configuration versioning and history
- [ ] Role-based access (manager vs. agent views)

**Design Principle:** Build the system to be "configurable by design" rather than hardcoded. The rubric stored in `COACHING_RUBRIC.md` is the v1 default, but the data model should support manager overrides from day one.

---

## Upcoming Features

### Near-term (This Sprint)
1. **Coaching Handler Implementation** ✅ RUBRIC COMPLETE
   - [x] Detailed coaching rubric created (`COACHING_RUBRIC.md`)
   - [x] 6 scoring categories with weights (Opening 10%, Discovery 30%, Presentation 20%, Objections 20%, Compliance 10%, Closing 10%)
   - [x] Tiered red flag system (Critical, High Priority, Medium Priority)
   - [x] Balance Care transition criteria
   - [x] Script-based scoring criteria (1-5 for each category)
   - [ ] Implement coaching handler in backend
   - [ ] Integrate rubric into Claude prompts
   - [ ] Store coaching results in database

2. **Session History**
   - Persist conversation history
   - Allow follow-up questions with context

3. **Team Summary Fix**
   - Database returns different columns than expected
   - Need to align response formatter with actual data

### Medium-term
1. **Objection Analysis**
   - Identify objections in calls
   - Evaluate agent's rebuttal effectiveness
   - Suggest better approaches

2. **Call Comparison**
   - Compare two agents' calls
   - Identify patterns in successful vs unsuccessful calls

3. **Trend Analysis**
   - Performance trends over time
   - Team-wide pattern detection

### Future Considerations
- Real-time call monitoring integration
- Agent self-service coaching portal
- Export reports to PDF
- Slack/Teams integration

---

## Technical Decisions

### Made
| Decision | Rationale |
|----------|-----------|
| Express over Fastify | Simpler setup, team familiarity |
| Claude claude-sonnet-4-20250514 | Best balance of quality and speed for intent classification |
| OpenAI text-embedding-3-small | Cost-effective, good quality for semantic search |
| Vite over CRA | Faster builds, better developer experience |
| Tailwind CSS | Rapid UI development, consistent styling |

### Pending
| Decision | Options | Notes |
|----------|---------|-------|
| Deployment platform | Vercel, Railway, Render | [TBD - Need to evaluate costs] |
| Session storage | Supabase, Redis, In-memory | [TBD - Depends on scale requirements] |
| Authentication | Supabase Auth, Auth0 | [TBD - Not yet implemented] |

---

## Data Model: Configurable Rubric System

To support the Manager Configuration Panel (Phase 6), the coaching system should be designed for configurability from v1. This means the rubric in `COACHING_RUBRIC.md` is the **default**, but managers can override any part of it.

### Proposed Tables (New)

```sql
-- Rubric configuration (one active version per organization)
CREATE TABLE coaching_rubric_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Category definitions with weights
CREATE TABLE rubric_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_config_id UUID REFERENCES coaching_rubric_config(id),
  name TEXT NOT NULL,                    -- e.g., "Opening & Rapport"
  slug TEXT NOT NULL,                    -- e.g., "opening_rapport"
  weight DECIMAL(3,2) NOT NULL,          -- e.g., 0.10 for 10%
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring criteria (1-5 for each category)
CREATE TABLE rubric_scoring_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES rubric_categories(id),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  criteria_text TEXT NOT NULL,           -- The description for this score level
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Red flag definitions
CREATE TABLE rubric_red_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_config_id UUID REFERENCES coaching_rubric_config(id),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  flag_key TEXT NOT NULL,                -- e.g., "ssn_before_citizenship"
  display_name TEXT NOT NULL,            -- e.g., "SSN before citizenship verification"
  description TEXT NOT NULL,
  detection_keywords TEXT[],             -- Keywords to help AI detect this flag
  threshold DECIMAL,                     -- For numeric flags like talk_ratio > 0.70
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Objection handling examples
CREATE TABLE rubric_objection_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_config_id UUID REFERENCES coaching_rubric_config(id),
  objection_text TEXT NOT NULL,          -- e.g., "Too expensive"
  weak_response TEXT NOT NULL,
  strong_response TEXT NOT NULL,
  sort_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coaching results (stores AI-generated coaching for each call)
CREATE TABLE coaching_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES call_metadata(id),
  rubric_config_id UUID REFERENCES coaching_rubric_config(id),
  overall_score DECIMAL(3,2),
  category_scores JSONB,                 -- {"opening": 4, "discovery": 3, ...}
  strengths TEXT[],
  improvements TEXT[],
  action_items TEXT[],
  red_flags_triggered TEXT[],            -- ["ssn_before_citizenship", ...]
  raw_ai_response TEXT,                  -- Full Claude response for debugging
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### V1 Implementation Strategy

For v1 (before Phase 6), the coaching handler will:
1. **Load rubric from `COACHING_RUBRIC.md`** at startup or on-demand
2. **Parse into structured format** matching the database schema above
3. **Use this in prompts** for Claude to evaluate calls
4. **Store results** in `coaching_results` table

When Phase 6 (Manager Configuration Panel) is implemented:
1. Managers can create new rubric versions in the database
2. The system checks for active database config first
3. Falls back to `COACHING_RUBRIC.md` if no database config exists
4. All coaching results link to the rubric version used

### Benefits of This Design
- **No breaking changes**: V1 works with markdown file, Phase 6 adds database override
- **Audit trail**: `rubric_config_id` on results shows which rubric version was used
- **A/B testing**: Could run different rubric versions to compare effectiveness
- **Team-specific**: Could extend to have team-level rubric customizations

---

## Known Constraints

1. **Database is pre-existing**: Cannot modify Supabase schema, must work with existing tables and RPC functions
2. **Rate limits**: Claude and OpenAI have rate limits that may affect high-traffic scenarios
3. **Embedding cost**: Semantic search requires OpenAI embedding calls (~$0.0001 per query)
4. **No authentication**: Currently no user authentication - anyone with the URL can access

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limiting | Medium | High | Implement request queuing, caching |
| Slow AI responses | Medium | Medium | Add response streaming, optimize prompts |
| Incorrect intent classification | Low | Medium | Confidence thresholds, fallback handling |
| Database query performance | Low | High | Use existing RPC functions, add indexes |

---

## Open Questions

- [ ] What authentication method should we use for production?
- [ ] Should we implement conversation history persistence?
- [ ] What's the expected concurrent user count for scaling decisions?
- [ ] Do we need audit logging for compliance?

---

**Status:** In Progress
**Last Updated:** 2026-01-20
