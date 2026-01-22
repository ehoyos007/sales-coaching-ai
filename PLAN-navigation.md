# PLAN.md — Navigation Accessibility for Agent Overview & Team Overview

> Strategic plan for fixing navigation accessibility. Created 2026-01-21.

---

## Objective

**Goal:** Make Agent Overview and Team Overview pages accessible through proper navigation paths.

**Success Criteria:**
- [ ] Managers can access Team Overview directly from sidebar navigation
- [ ] Clicking an agent in Team Overview navigates to that agent's Agent Overview page
- [ ] Navigation is role-appropriate (managers vs agents vs admins)
- [ ] Back navigation works correctly from both pages

---

## Background / Context

**Current State:**

| Page | Route | Current Accessibility |
|------|-------|----------------------|
| Agent Overview | `/agents/:agentId/overview` | Not accessible through any navigation; requires knowing the URL |
| Team Overview | `/teams/:teamId/overview` | Only accessible via Admin Panel → Teams tab → "View Dashboard" button |

**Problem:** These dashboard pages exist but are essentially hidden from users who should have access to them.

---

## Requirements

### Functional Requirements

1. **Sidebar Navigation for Managers:**
   - Add "Team Overview" link in sidebar for managers
   - Link should use the manager's assigned team ID
   - Only show when the manager has a team assigned

2. **Agent Click-Through (Already Implemented ✅):**
   - Team Overview's AgentBreakdownTable already navigates to `/agents/${agent.agentUserId}/overview` on row click
   - No changes needed for this functionality

3. **Consider: Agent's Own Overview Access:**
   - Should agents have a sidebar link to their own Agent Overview page?
   - This would provide a "My Performance" dashboard access point

### Non-Functional Requirements
- Consistent styling with existing sidebar links
- Role-based visibility (don't show links users can't access)
- Handle edge cases (manager without a team assigned)

---

## Current Navigation Structure

### Sidebar Footer Links (Role-Based)

```
┌─────────────────────────────────┐
│ Footer (bg-slate-50)            │
│                                 │
│ [Admin Panel] ← admin/manager   │
│ [Rubric Settings] ← admin/mgr   │
│                                 │
│ Powered by AI | v1.0.0          │
└─────────────────────────────────┘
```

### Data Available in Auth Context

From `AuthContext.tsx`, the `user` object contains:

```typescript
interface CombinedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;        // 'admin' | 'manager' | 'agent'
  teamId: string | null; // Manager's team ID
  teamName: string | null;
}
```

This means we have `user.teamId` available for constructing the Team Overview link.

---

## Proposed Approach

### Option A: Add Team Overview Link for Managers ⭐ Recommended

**Description:** Add a "Team Overview" link in the sidebar footer that appears for managers who have a team assigned.

**Implementation:**
```tsx
// In Sidebar.tsx footer section
{user?.role === 'manager' && user?.teamId && (
  <Link
    to={`/teams/${user.teamId}/overview`}
    className="flex items-center justify-center gap-2 w-full py-2 text-sm..."
  >
    <ChartIcon />
    Team Overview
  </Link>
)}
```

**Pros:**
- Minimal changes (one file)
- Uses existing data from auth context
- Consistent with current sidebar patterns

**Cons:**
- Admins without a specific team won't have a direct link (they use Admin Panel → Teams)

**Effort:** Low

---

### Option B: Add "My Performance" Link for Agents

**Description:** Additionally, give agents direct access to their own Agent Overview page.

**Implementation:**
```tsx
// In Sidebar.tsx footer section
{user?.role === 'agent' && user?.id && (
  <Link
    to={`/agents/${user.id}/overview`}
    className="..."
  >
    <UserIcon />
    My Performance
  </Link>
)}
```

**Pros:**
- Agents can see their own dashboard
- Symmetry with manager's Team Overview access

**Cons:**
- May require verifying that agent ID matches the route parameter format

**Effort:** Low

---

### Recommendation

**Implement Option A** (Team Overview for managers) as the primary requirement.

**Consider Option B** (My Performance for agents) as an enhancement — I'll include it as an optional task for your decision.

---

## Technical Design

### Files to Modify

| File | Changes |
|------|---------|
| `client/src/components/Sidebar/Sidebar.tsx` | Add Team Overview link for managers; optionally add My Performance for agents |

### No Changes Needed

| Component | Reason |
|-----------|--------|
| `App.tsx` (routing) | Routes already exist |
| `AgentBreakdownTable.tsx` | Already has click-through to Agent Overview |
| `TeamOverviewPage.tsx` | No changes needed |
| `AgentOverviewPage.tsx` | Already has smart back-link based on role |

### Auth Context Data

Already available:
- `user.teamId` — Manager's assigned team
- `user.id` — User's ID (for agent's own overview)
- `user.role` — For conditional rendering

---

## Implementation Plan

### Phase 1: Add Team Overview Link for Managers

- [ ] **Task 1.1:** Modify `Sidebar.tsx` to import `user` from `useAuth()` (currently only imports `profile`)
- [ ] **Task 1.2:** Add "Team Overview" link in footer section with proper role/team checks
- [ ] **Task 1.3:** Add appropriate icon (chart/dashboard icon) matching existing style
- [ ] **Task 1.4:** Test navigation flow: Sidebar → Team Overview → Agent Overview (click row)

### Phase 2: Optional Enhancement — My Performance for Agents

- [ ] **Task 2.1:** Add "My Performance" link for agents in sidebar footer
- [ ] **Task 2.2:** Verify agent ID format works with route parameter

### Phase 3: Verification

- [ ] **Task 3.1:** Test as manager: see Team Overview link, click through to Agent Overview
- [ ] **Task 3.2:** Test as admin: verify they still access via Admin Panel (existing flow)
- [ ] **Task 3.3:** Test as agent: verify role-appropriate visibility (if Option B is implemented)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Manager without team assigned | Low | Low | Conditional rendering — link only shows if `user.teamId` exists |
| Agent ID format mismatch | Low | Medium | Test with existing agent accounts |

---

## Open Questions

- [ ] **Should agents have access to their own Agent Overview via sidebar?** (Option B)
  - Current state: They can only access it if they know the URL
  - Proposed: Add "My Performance" link for agents

---

## Visual Mockup

### Proposed Sidebar Footer (Manager View)

```
┌─────────────────────────────────┐
│ Footer (bg-slate-50)            │
│                                 │
│ [📊 Team Overview]  ← NEW       │
│ [👥 Admin Panel]                │
│ [⚙️ Rubric Settings]            │
│                                 │
│ Powered by AI | v1.0.0          │
└─────────────────────────────────┘
```

### Navigation Flow After Implementation

```
Manager Flow:
Sidebar [Team Overview] → /teams/:teamId/overview
                              ↓ (click agent row)
                         /agents/:agentId/overview
                              ↓ (back link)
                         /admin (Admin Panel)

Agent Flow (if Option B):
Sidebar [My Performance] → /agents/:agentId/overview
                              ↓ (back link)
                         / (Chat)
```

---

**Status:** Ready for Review
**Author:** Claude
**Last Updated:** 2026-01-21
