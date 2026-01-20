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

---

## Upcoming Features

### Near-term (This Sprint)
1. **Coaching Handler Implementation**
   - Analyze call transcripts against coaching rubric
   - Score calls on: Opening, Needs Discovery, Presentation, Objection Handling, Closing
   - Provide specific examples from the call

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
