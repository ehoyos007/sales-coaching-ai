# CLAUDE.md - Sales Coaching AI

Project-specific instructions for Claude Code sessions.

---

## Project Overview

**Sales Coaching AI** - An AI-powered sales coaching chat interface for analyzing agent call data. Built with React (Vite) frontend and Express backend, deployed on Railway, with Supabase for database and auth.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Express.js + TypeScript (currently), migrating to Vercel Serverless
- Database: Supabase (PostgreSQL + pgvector)
- AI: Claude (Anthropic) for analysis, OpenAI for embeddings
- Deployment: Railway (current), Vercel (planned)

---

## Git Branching Strategy

### Branch Overview

| Branch | Commit | Purpose | Status |
|--------|--------|---------|--------|
| `main` | cd81c4c | Production branch - last stable deployment | **PROTECTED** |
| `feature/vercel-migration` | cd81c4c+ | Active development for Vercel migration | **ACTIVE** |
| `broken-main-backup` | 724d694 | Backup of failed deployment | **DO NOT USE** |

### Branch Rules

1. **NEVER push changes directly to `main`**
2. **ALL development work should happen on `feature/vercel-migration` or other feature branches**
3. `main` should only be updated via tested, working merges from feature branches
4. Always verify you're on the correct branch before making commits:
   ```bash
   git branch --show-current
   ```

### Current Working Branch

- **Active branch:** `feature/vercel-migration`
- **Base commit:** cd81c4c
- **Purpose:** Implementing Vercel migration and planned improvements in phases

### Before Starting Work

Always run these checks at the start of a session:
```bash
# Verify current branch
git branch --show-current

# If not on feature branch, switch to it
git checkout feature/vercel-migration

# Check for any uncommitted changes
git status
```

### Deployment Information

| Platform | Branch | Status |
|----------|--------|--------|
| Railway | `main` | Active - production deployment |
| Vercel | TBD | Will be configured on feature branch first |

---

## Key Documentation Files

- `PROGRESS.md` - Session logs and completed work
- `TASKS.md` - Active task tracking
- `tasks/prd-sales-coaching-ai-v2.md` - Product requirements document for v2

---

## Important Directories

```
sales-coaching-ai/
├── client/           # React frontend (Vite)
├── src/              # Express backend (current)
├── api/              # Vercel serverless routes (in development)
├── lib/              # Shared library for Vercel (in development)
├── supabase/         # Database migrations
└── tasks/            # Planning documents
```

---

## Session Checklist

At the start of each session:
1. [ ] Verify on `feature/vercel-migration` branch
2. [ ] Read PROGRESS.md for context
3. [ ] Check TASKS.md for current priorities
4. [ ] Run `git status` to check for uncommitted changes

At the end of each session:
1. [ ] Commit all changes to feature branch
2. [ ] Update PROGRESS.md with session summary
3. [ ] Update TASKS.md if priorities changed
4. [ ] Push changes: `git push origin feature/vercel-migration`
