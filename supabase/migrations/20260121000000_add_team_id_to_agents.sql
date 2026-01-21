-- =============================================
-- Migration: Add team_id to agents table
-- Links sales agents to teams for team-based management
-- =============================================

-- Add team_id column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for efficient team queries
CREATE INDEX IF NOT EXISTS idx_agents_team_id ON agents(team_id);

-- Update member_count to reflect agents (not user_profiles)
-- This is a view/function that should count agents, not user_profiles
COMMENT ON COLUMN agents.team_id IS 'References the team this sales agent belongs to';
