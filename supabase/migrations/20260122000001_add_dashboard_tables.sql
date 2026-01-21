-- Migration: Add Dashboard Tables and RPC Functions
-- Description: Create compliance_scores, agent_goals tables and RPC functions for Team/Agent Overview dashboards

-- ============================================================================
-- Table: compliance_scores
-- Stores compliance analysis results per call
-- ============================================================================
CREATE TABLE compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL,
  agent_user_id TEXT NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rubric_config_id UUID REFERENCES coaching_rubric_config(id) ON DELETE SET NULL,
  violations JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ category, severity, description, timestamp? }]
  compliance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (call_id)
);

-- ============================================================================
-- Table: agent_goals
-- Stores performance goals for agents or teams
-- ============================================================================
CREATE TABLE agent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id TEXT,  -- NULL for team-wide goals
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('calls', 'duration', 'compliance_score', 'objection_resolution')),
  target_value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_start <= period_end),
  CONSTRAINT agent_or_team CHECK (
    (agent_user_id IS NOT NULL AND team_id IS NULL) OR
    (agent_user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_compliance_scores_agent ON compliance_scores(agent_user_id);
CREATE INDEX idx_compliance_scores_call ON compliance_scores(call_id);
CREATE INDEX idx_compliance_scores_analyzed_at ON compliance_scores(analyzed_at DESC);
CREATE INDEX idx_compliance_scores_agent_analyzed ON compliance_scores(agent_user_id, analyzed_at DESC);

CREATE INDEX idx_agent_goals_agent ON agent_goals(agent_user_id) WHERE agent_user_id IS NOT NULL;
CREATE INDEX idx_agent_goals_team ON agent_goals(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_agent_goals_period ON agent_goals(period_start, period_end);
CREATE INDEX idx_agent_goals_active ON agent_goals(is_active) WHERE is_active = true;

-- ============================================================================
-- Trigger: Auto-update updated_at for agent_goals
-- ============================================================================
CREATE OR REPLACE FUNCTION update_agent_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_goals_updated_at
  BEFORE UPDATE ON agent_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_goals_updated_at();

-- ============================================================================
-- RPC Function: get_team_overview_metrics
-- Returns aggregated metrics for a team
-- ============================================================================
CREATE OR REPLACE FUNCTION get_team_overview_metrics(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_prev_start DATE;
  v_prev_end DATE;
BEGIN
  -- Calculate previous period for comparison
  v_prev_start := p_start_date - (p_end_date - p_start_date + 1);
  v_prev_end := p_start_date - INTERVAL '1 day';

  SELECT json_build_object(
    'team_id', p_team_id,
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'summary', (
      SELECT json_build_object(
        'total_calls', COALESCE(COUNT(*), 0),
        'total_duration_seconds', COALESCE(SUM(cm.total_duration_seconds), 0),
        'avg_duration_seconds', COALESCE(AVG(cm.total_duration_seconds), 0),
        'avg_talk_ratio', COALESCE(AVG(cm.agent_talk_percentage), 0),
        'inbound_calls', COALESCE(SUM(CASE WHEN cm.is_inbound_call THEN 1 ELSE 0 END), 0),
        'outbound_calls', COALESCE(SUM(CASE WHEN NOT cm.is_inbound_call THEN 1 ELSE 0 END), 0),
        'unique_agents', COUNT(DISTINCT cm.agent_user_id)
      )
      FROM call_metadata cm
      INNER JOIN agents a ON cm.agent_user_id = a.agent_user_id::text
      WHERE a.team_id = p_team_id
        AND cm.call_date >= p_start_date
        AND cm.call_date <= p_end_date
    ),
    'compliance', (
      SELECT json_build_object(
        'avg_score', COALESCE(AVG(cs.overall_score), 0),
        'total_analyzed', COUNT(*),
        'critical_violations', COALESCE(SUM(
          jsonb_array_length(
            COALESCE(
              (SELECT jsonb_agg(v) FROM jsonb_array_elements(cs.violations) v WHERE v->>'severity' = 'critical'),
              '[]'::jsonb
            )
          )
        ), 0)
      )
      FROM compliance_scores cs
      INNER JOIN agents a ON cs.agent_user_id = a.agent_user_id::text
      WHERE a.team_id = p_team_id
        AND cs.analyzed_at >= p_start_date
        AND cs.analyzed_at <= p_end_date + INTERVAL '1 day'
    ),
    'agent_breakdown', (
      SELECT COALESCE(json_agg(agent_stats), '[]'::json)
      FROM (
        SELECT
          a.agent_user_id,
          a.first_name,
          a.email,
          COUNT(cm.call_id) AS total_calls,
          COALESCE(AVG(cm.total_duration_seconds), 0) AS avg_duration,
          COALESCE(AVG(cm.agent_talk_percentage), 0) AS avg_talk_ratio,
          COALESCE(AVG(cs.overall_score), 0) AS avg_compliance_score
        FROM agents a
        LEFT JOIN call_metadata cm ON cm.agent_user_id = a.agent_user_id::text
          AND cm.call_date >= p_start_date
          AND cm.call_date <= p_end_date
        LEFT JOIN compliance_scores cs ON cs.agent_user_id = a.agent_user_id::text
          AND cs.analyzed_at >= p_start_date
          AND cs.analyzed_at <= p_end_date + INTERVAL '1 day'
        WHERE a.team_id = p_team_id
        GROUP BY a.agent_user_id, a.first_name, a.email
        ORDER BY COUNT(cm.call_id) DESC
      ) agent_stats
    ),
    'previous_period', (
      SELECT json_build_object(
        'total_calls', COALESCE(COUNT(*), 0),
        'avg_duration_seconds', COALESCE(AVG(cm.total_duration_seconds), 0),
        'avg_talk_ratio', COALESCE(AVG(cm.agent_talk_percentage), 0)
      )
      FROM call_metadata cm
      INNER JOIN agents a ON cm.agent_user_id = a.agent_user_id::text
      WHERE a.team_id = p_team_id
        AND cm.call_date >= v_prev_start
        AND cm.call_date <= v_prev_end
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_agent_overview_metrics
-- Returns metrics for a single agent
-- Fixed: Separated team_comparison calculation to avoid mixing aggregates with window functions
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agent_overview_metrics(
  p_agent_user_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_prev_start DATE;
  v_prev_end DATE;
  v_team_id UUID;
  v_team_comparison JSON;
BEGIN
  -- Calculate previous period for comparison
  v_prev_start := p_start_date - (p_end_date - p_start_date + 1);
  v_prev_end := p_start_date - INTERVAL '1 day';

  -- Get agent's team
  SELECT team_id INTO v_team_id FROM agents WHERE agent_user_id::text = p_agent_user_id;

  -- Calculate team comparison separately to avoid mixing aggregates with window functions
  IF v_team_id IS NOT NULL THEN
    WITH agent_stats AS (
      SELECT
        a.agent_user_id,
        COUNT(cm.call_id) as call_count,
        COALESCE(AVG(cm.total_duration_seconds), 0) as avg_duration,
        COALESCE(AVG(cm.agent_talk_percentage), 0) as avg_talk_ratio,
        COALESCE((SELECT AVG(cs.overall_score) FROM compliance_scores cs
         WHERE cs.agent_user_id = a.agent_user_id::text
           AND cs.analyzed_at >= p_start_date
           AND cs.analyzed_at <= p_end_date + INTERVAL '1 day'), 0) as avg_compliance
      FROM agents a
      LEFT JOIN call_metadata cm ON cm.agent_user_id = a.agent_user_id::text
        AND cm.call_date >= p_start_date
        AND cm.call_date <= p_end_date
      WHERE a.team_id = v_team_id
      GROUP BY a.agent_user_id
    ),
    team_averages AS (
      SELECT
        AVG(call_count) as team_avg_calls,
        AVG(avg_duration) as team_avg_duration,
        AVG(avg_talk_ratio) as team_avg_talk_ratio,
        AVG(avg_compliance) as team_avg_compliance
      FROM agent_stats
    ),
    agent_percentiles AS (
      SELECT
        agent_user_id,
        PERCENT_RANK() OVER (ORDER BY call_count) as percentile_calls,
        PERCENT_RANK() OVER (ORDER BY avg_compliance) as percentile_compliance
      FROM agent_stats
    )
    SELECT json_build_object(
      'team_avg_calls', COALESCE(ta.team_avg_calls, 0),
      'team_avg_duration', COALESCE(ta.team_avg_duration, 0),
      'team_avg_talk_ratio', COALESCE(ta.team_avg_talk_ratio, 0),
      'team_avg_compliance', COALESCE(ta.team_avg_compliance, 0),
      'agent_percentile_calls', COALESCE(ap.percentile_calls, 0),
      'agent_percentile_compliance', COALESCE(ap.percentile_compliance, 0)
    ) INTO v_team_comparison
    FROM team_averages ta
    CROSS JOIN agent_percentiles ap
    WHERE ap.agent_user_id::text = p_agent_user_id;
  END IF;

  SELECT json_build_object(
    'agent_user_id', p_agent_user_id,
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'summary', (
      SELECT json_build_object(
        'total_calls', COALESCE(COUNT(*), 0),
        'total_duration_seconds', COALESCE(SUM(cm.total_duration_seconds), 0),
        'avg_duration_seconds', COALESCE(AVG(cm.total_duration_seconds), 0),
        'avg_talk_ratio', COALESCE(AVG(cm.agent_talk_percentage), 0),
        'inbound_calls', COALESCE(SUM(CASE WHEN cm.is_inbound_call THEN 1 ELSE 0 END), 0),
        'outbound_calls', COALESCE(SUM(CASE WHEN NOT cm.is_inbound_call THEN 1 ELSE 0 END), 0)
      )
      FROM call_metadata cm
      WHERE cm.agent_user_id = p_agent_user_id
        AND cm.call_date >= p_start_date
        AND cm.call_date <= p_end_date
    ),
    'compliance', (
      SELECT json_build_object(
        'avg_score', COALESCE(AVG(cs.overall_score), 0),
        'total_analyzed', COUNT(*),
        'violations', COALESCE((
          SELECT json_agg(v)
          FROM (
            SELECT v->>'category' as category, v->>'severity' as severity, COUNT(*) as count
            FROM compliance_scores cs2,
            LATERAL jsonb_array_elements(cs2.violations) as v
            WHERE cs2.agent_user_id = p_agent_user_id
              AND cs2.analyzed_at >= p_start_date
              AND cs2.analyzed_at <= p_end_date + INTERVAL '1 day'
            GROUP BY v->>'category', v->>'severity'
          ) v
        ), '[]'::json)
      )
      FROM compliance_scores cs
      WHERE cs.agent_user_id = p_agent_user_id
        AND cs.analyzed_at >= p_start_date
        AND cs.analyzed_at <= p_end_date + INTERVAL '1 day'
    ),
    'previous_period', (
      SELECT json_build_object(
        'total_calls', COALESCE(COUNT(*), 0),
        'avg_duration_seconds', COALESCE(AVG(cm.total_duration_seconds), 0),
        'avg_talk_ratio', COALESCE(AVG(cm.agent_talk_percentage), 0),
        'avg_compliance_score', (
          SELECT COALESCE(AVG(cs.overall_score), 0)
          FROM compliance_scores cs
          WHERE cs.agent_user_id = p_agent_user_id
            AND cs.analyzed_at >= v_prev_start
            AND cs.analyzed_at <= v_prev_end + INTERVAL '1 day'
        )
      )
      FROM call_metadata cm
      WHERE cm.agent_user_id = p_agent_user_id
        AND cm.call_date >= v_prev_start
        AND cm.call_date <= v_prev_end
    ),
    'team_comparison', v_team_comparison
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_call_volume_trend
-- Returns daily call counts for charts
-- ============================================================================
CREATE OR REPLACE FUNCTION get_call_volume_trend(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  call_date DATE,
  call_count BIGINT,
  inbound_count BIGINT,
  outbound_count BIGINT,
  total_duration_seconds BIGINT,
  avg_duration_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.call_date::DATE,
    COUNT(*)::BIGINT as call_count,
    SUM(CASE WHEN cm.is_inbound_call THEN 1 ELSE 0 END)::BIGINT as inbound_count,
    SUM(CASE WHEN NOT cm.is_inbound_call THEN 1 ELSE 0 END)::BIGINT as outbound_count,
    SUM(cm.total_duration_seconds)::BIGINT as total_duration_seconds,
    ROUND(AVG(cm.total_duration_seconds), 2) as avg_duration_seconds
  FROM call_metadata cm
  LEFT JOIN agents a ON cm.agent_user_id = a.agent_user_id::text
  WHERE (p_agent_user_id IS NULL OR cm.agent_user_id = p_agent_user_id)
    AND (p_team_id IS NULL OR a.team_id = p_team_id)
    AND (p_start_date IS NULL OR cm.call_date >= p_start_date)
    AND (p_end_date IS NULL OR cm.call_date <= p_end_date)
  GROUP BY cm.call_date::DATE
  ORDER BY cm.call_date::DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_compliance_summary
-- Returns compliance metrics aggregated by category
-- ============================================================================
CREATE OR REPLACE FUNCTION get_compliance_summary(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'avg_score', COALESCE(AVG(cs.overall_score), 0),
    'total_analyzed', COUNT(*),
    'score_distribution', (
      SELECT json_agg(dist)
      FROM (
        SELECT
          CASE
            WHEN cs2.overall_score >= 90 THEN 'excellent'
            WHEN cs2.overall_score >= 80 THEN 'good'
            WHEN cs2.overall_score >= 70 THEN 'needs_improvement'
            ELSE 'critical'
          END as rating,
          COUNT(*) as count
        FROM compliance_scores cs2
        LEFT JOIN agents a2 ON cs2.agent_user_id = a2.agent_user_id::text
        WHERE (p_agent_user_id IS NULL OR cs2.agent_user_id = p_agent_user_id)
          AND (p_team_id IS NULL OR a2.team_id = p_team_id)
          AND (p_start_date IS NULL OR cs2.analyzed_at >= p_start_date)
          AND (p_end_date IS NULL OR cs2.analyzed_at <= p_end_date + INTERVAL '1 day')
        GROUP BY rating
      ) dist
    ),
    'violations_by_category', (
      SELECT json_agg(viol)
      FROM (
        SELECT
          v->>'category' as category,
          v->>'severity' as severity,
          COUNT(*) as count
        FROM compliance_scores cs3
        LEFT JOIN agents a3 ON cs3.agent_user_id = a3.agent_user_id::text,
        LATERAL jsonb_array_elements(cs3.violations) as v
        WHERE (p_agent_user_id IS NULL OR cs3.agent_user_id = p_agent_user_id)
          AND (p_team_id IS NULL OR a3.team_id = p_team_id)
          AND (p_start_date IS NULL OR cs3.analyzed_at >= p_start_date)
          AND (p_end_date IS NULL OR cs3.analyzed_at <= p_end_date + INTERVAL '1 day')
        GROUP BY v->>'category', v->>'severity'
        ORDER BY count DESC
      ) viol
    )
  ) INTO v_result
  FROM compliance_scores cs
  LEFT JOIN agents a ON cs.agent_user_id = a.agent_user_id::text
  WHERE (p_agent_user_id IS NULL OR cs.agent_user_id = p_agent_user_id)
    AND (p_team_id IS NULL OR a.team_id = p_team_id)
    AND (p_start_date IS NULL OR cs.analyzed_at >= p_start_date)
    AND (p_end_date IS NULL OR cs.analyzed_at <= p_end_date + INTERVAL '1 day');

  RETURN COALESCE(v_result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_goals_progress
-- Returns goal progress for agent or team
-- ============================================================================
CREATE OR REPLACE FUNCTION get_goals_progress(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  goal_type TEXT,
  target_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  progress_percentage DECIMAL(5,2),
  period_start DATE,
  period_end DATE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.goal_type,
    g.target_value,
    g.actual_value,
    CASE
      WHEN g.target_value > 0 THEN ROUND((g.actual_value / g.target_value) * 100, 2)
      ELSE 0
    END as progress_percentage,
    g.period_start,
    g.period_end,
    g.is_active
  FROM agent_goals g
  WHERE (p_agent_user_id IS NULL OR g.agent_user_id = p_agent_user_id)
    AND (p_team_id IS NULL OR g.team_id = p_team_id)
    AND (p_period_start IS NULL OR g.period_end >= p_period_start)
    AND (p_period_end IS NULL OR g.period_start <= p_period_end)
  ORDER BY g.period_start DESC, g.goal_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC Function: get_objection_summary
-- Returns objection handling metrics for dashboard
-- ============================================================================
CREATE OR REPLACE FUNCTION get_objection_summary(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'top_objections', (
      SELECT COALESCE(json_agg(obj), '[]'::json)
      FROM (
        SELECT
          o.objection_type,
          COUNT(*) as total_occurrences,
          ROUND(AVG(o.response_quality), 2) as avg_score,
          ROUND(AVG(CASE WHEN o.was_resolved THEN 100.0 ELSE 0.0 END), 1) as resolution_rate
        FROM objection_occurrences o
        LEFT JOIN agents a ON o.agent_user_id = a.agent_user_id
        WHERE (p_agent_user_id IS NULL OR o.agent_user_id::text = p_agent_user_id)
          AND (p_team_id IS NULL OR a.team_id = p_team_id)
          AND (p_start_date IS NULL OR o.created_at >= p_start_date)
          AND (p_end_date IS NULL OR o.created_at <= p_end_date + INTERVAL '1 day')
        GROUP BY o.objection_type
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) obj
    ),
    'overall_stats', (
      SELECT json_build_object(
        'total_objections', COUNT(*),
        'avg_response_quality', ROUND(AVG(o.response_quality), 2),
        'overall_resolution_rate', ROUND(AVG(CASE WHEN o.was_resolved THEN 100.0 ELSE 0.0 END), 1)
      )
      FROM objection_occurrences o
      LEFT JOIN agents a ON o.agent_user_id = a.agent_user_id
      WHERE (p_agent_user_id IS NULL OR o.agent_user_id::text = p_agent_user_id)
        AND (p_team_id IS NULL OR a.team_id = p_team_id)
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date + INTERVAL '1 day')
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Enable RLS (Row Level Security)
-- ============================================================================
ALTER TABLE compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_goals ENABLE ROW LEVEL SECURITY;

-- Policies for service role access (full access)
CREATE POLICY "Service role full access to compliance_scores"
  ON compliance_scores
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to agent_goals"
  ON agent_goals
  FOR ALL
  USING (true)
  WITH CHECK (true);
