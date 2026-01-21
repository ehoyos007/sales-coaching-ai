-- Migration: Add Agent Objection Stats Tables
-- Description: Track objection handling patterns per agent for pattern-aware coaching

-- ============================================================================
-- Table: agent_objection_stats
-- Aggregated statistics per agent per objection type
-- ============================================================================
CREATE TABLE agent_objection_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id UUID NOT NULL,
  objection_type TEXT NOT NULL,
  total_occurrences INT NOT NULL DEFAULT 0,
  total_score_points INT NOT NULL DEFAULT 0,
  resolved_count INT NOT NULL DEFAULT 0,
  unresolved_count INT NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_user_id, objection_type)
);

-- ============================================================================
-- Table: objection_occurrences
-- Individual objection records with verbatim snippets
-- ============================================================================
CREATE TABLE objection_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id UUID NOT NULL,
  call_id UUID NOT NULL,
  objection_type TEXT NOT NULL,
  response_quality INT NOT NULL CHECK (response_quality BETWEEN 1 AND 5),
  was_resolved BOOLEAN NOT NULL DEFAULT false,
  customer_sentiment TEXT CHECK (customer_sentiment IN ('mild', 'moderate', 'strong')),
  objection_snippet TEXT,
  rebuttal_snippet TEXT,
  full_exchange TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_agent_objection_stats_agent ON agent_objection_stats(agent_user_id);
CREATE INDEX idx_agent_objection_stats_type ON agent_objection_stats(objection_type);
CREATE INDEX idx_agent_objection_stats_agent_type ON agent_objection_stats(agent_user_id, objection_type);

CREATE INDEX idx_objection_occurrences_agent ON objection_occurrences(agent_user_id);
CREATE INDEX idx_objection_occurrences_call ON objection_occurrences(call_id);
CREATE INDEX idx_objection_occurrences_type ON objection_occurrences(objection_type);
CREATE INDEX idx_objection_occurrences_agent_type ON objection_occurrences(agent_user_id, objection_type);
CREATE INDEX idx_objection_occurrences_created ON objection_occurrences(created_at DESC);

-- ============================================================================
-- Function: update_agent_objection_stats_updated_at
-- Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_agent_objection_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_objection_stats_updated_at
  BEFORE UPDATE ON agent_objection_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_objection_stats_updated_at();

-- ============================================================================
-- RPC Function: record_objection
-- Atomic upsert of stats + insert occurrence
-- ============================================================================
CREATE OR REPLACE FUNCTION record_objection(
  p_agent_user_id UUID,
  p_call_id UUID,
  p_objection_type TEXT,
  p_response_quality INT,
  p_was_resolved BOOLEAN,
  p_customer_sentiment TEXT DEFAULT NULL,
  p_objection_snippet TEXT DEFAULT NULL,
  p_rebuttal_snippet TEXT DEFAULT NULL,
  p_full_exchange TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_occurrence_id UUID;
  v_stats_id UUID;
BEGIN
  -- Insert occurrence record
  INSERT INTO objection_occurrences (
    agent_user_id,
    call_id,
    objection_type,
    response_quality,
    was_resolved,
    customer_sentiment,
    objection_snippet,
    rebuttal_snippet,
    full_exchange
  ) VALUES (
    p_agent_user_id,
    p_call_id,
    p_objection_type,
    p_response_quality,
    p_was_resolved,
    p_customer_sentiment,
    p_objection_snippet,
    p_rebuttal_snippet,
    p_full_exchange
  )
  RETURNING id INTO v_occurrence_id;

  -- Upsert aggregated stats
  INSERT INTO agent_objection_stats (
    agent_user_id,
    objection_type,
    total_occurrences,
    total_score_points,
    resolved_count,
    unresolved_count,
    first_seen_at,
    last_seen_at
  ) VALUES (
    p_agent_user_id,
    p_objection_type,
    1,
    p_response_quality,
    CASE WHEN p_was_resolved THEN 1 ELSE 0 END,
    CASE WHEN p_was_resolved THEN 0 ELSE 1 END,
    now(),
    now()
  )
  ON CONFLICT (agent_user_id, objection_type) DO UPDATE SET
    total_occurrences = agent_objection_stats.total_occurrences + 1,
    total_score_points = agent_objection_stats.total_score_points + p_response_quality,
    resolved_count = agent_objection_stats.resolved_count + CASE WHEN p_was_resolved THEN 1 ELSE 0 END,
    unresolved_count = agent_objection_stats.unresolved_count + CASE WHEN p_was_resolved THEN 0 ELSE 1 END,
    last_seen_at = now()
  RETURNING id INTO v_stats_id;

  RETURN json_build_object(
    'occurrence_id', v_occurrence_id,
    'stats_id', v_stats_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_agent_objection_stats
-- Get all stats for an agent with computed averages
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agent_objection_stats(p_agent_user_id UUID)
RETURNS TABLE (
  objection_type TEXT,
  total_occurrences INT,
  avg_score NUMERIC,
  resolved_count INT,
  unresolved_count INT,
  resolution_rate NUMERIC,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.objection_type,
    s.total_occurrences,
    ROUND(s.total_score_points::NUMERIC / NULLIF(s.total_occurrences, 0), 2) AS avg_score,
    s.resolved_count,
    s.unresolved_count,
    ROUND(s.resolved_count::NUMERIC / NULLIF(s.total_occurrences, 0) * 100, 1) AS resolution_rate,
    s.first_seen_at,
    s.last_seen_at
  FROM agent_objection_stats s
  WHERE s.agent_user_id = p_agent_user_id
  ORDER BY s.total_occurrences DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_agent_weak_areas
-- Get lowest scoring objection types (min 2 occurrences)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agent_weak_areas(
  p_agent_user_id UUID,
  p_min_occurrences INT DEFAULT 2,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  objection_type TEXT,
  total_occurrences INT,
  avg_score NUMERIC,
  resolution_rate NUMERIC,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.objection_type,
    s.total_occurrences,
    ROUND(s.total_score_points::NUMERIC / NULLIF(s.total_occurrences, 0), 2) AS avg_score,
    ROUND(s.resolved_count::NUMERIC / NULLIF(s.total_occurrences, 0) * 100, 1) AS resolution_rate,
    s.last_seen_at
  FROM agent_objection_stats s
  WHERE s.agent_user_id = p_agent_user_id
    AND s.total_occurrences >= p_min_occurrences
  ORDER BY (s.total_score_points::NUMERIC / NULLIF(s.total_occurrences, 0)) ASC,
           s.total_occurrences DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_agent_strong_areas
-- Get highest scoring objection types (min 2 occurrences)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agent_strong_areas(
  p_agent_user_id UUID,
  p_min_occurrences INT DEFAULT 2,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  objection_type TEXT,
  total_occurrences INT,
  avg_score NUMERIC,
  resolution_rate NUMERIC,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.objection_type,
    s.total_occurrences,
    ROUND(s.total_score_points::NUMERIC / NULLIF(s.total_occurrences, 0), 2) AS avg_score,
    ROUND(s.resolved_count::NUMERIC / NULLIF(s.total_occurrences, 0) * 100, 1) AS resolution_rate,
    s.last_seen_at
  FROM agent_objection_stats s
  WHERE s.agent_user_id = p_agent_user_id
    AND s.total_occurrences >= p_min_occurrences
  ORDER BY (s.total_score_points::NUMERIC / NULLIF(s.total_occurrences, 0)) DESC,
           s.total_occurrences DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_team_objection_trends
-- Team-wide aggregations by objection type
-- ============================================================================
CREATE OR REPLACE FUNCTION get_team_objection_trends(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  objection_type TEXT,
  total_occurrences BIGINT,
  unique_agents BIGINT,
  avg_score NUMERIC,
  avg_resolution_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.objection_type,
    COUNT(*)::BIGINT AS total_occurrences,
    COUNT(DISTINCT o.agent_user_id)::BIGINT AS unique_agents,
    ROUND(AVG(o.response_quality), 2) AS avg_score,
    ROUND(AVG(CASE WHEN o.was_resolved THEN 100.0 ELSE 0.0 END), 1) AS avg_resolution_rate
  FROM objection_occurrences o
  WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY o.objection_type
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Enable RLS (Row Level Security)
-- ============================================================================
ALTER TABLE agent_objection_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies for service role access (full access)
CREATE POLICY "Service role full access to agent_objection_stats"
  ON agent_objection_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to objection_occurrences"
  ON objection_occurrences
  FOR ALL
  USING (true)
  WITH CHECK (true);
