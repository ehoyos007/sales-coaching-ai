-- ============================================================================
-- Migration: Fix UUID parameter type mismatch in dashboard RPC functions
-- Problem: Supabase JS client passes strings, but functions expect UUID type
-- Solution: Change p_team_id from UUID to TEXT and cast internally
-- ============================================================================

-- ============================================================================
-- Fix get_team_overview_metrics function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_team_overview_metrics(
  p_team_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_result JSON;
BEGIN
  -- Cast text to UUID
  v_team_id := p_team_id::UUID;

  WITH team_agents AS (
    SELECT agent_user_id
    FROM agents
    WHERE team_id = v_team_id
  ),
  call_metrics AS (
    SELECT
      COUNT(DISTINCT c.call_id) as total_calls,
      COUNT(DISTINCT c.agent_user_id) as active_agents,
      COALESCE(SUM(c.total_duration_seconds), 0) as total_duration_seconds,
      COALESCE(AVG(c.total_duration_seconds), 0) as avg_duration_seconds,
      COALESCE(AVG(c.agent_talk_percentage), 0) as avg_talk_percentage,
      COUNT(CASE WHEN c.is_inbound_call THEN 1 END) as inbound_calls,
      COUNT(CASE WHEN NOT c.is_inbound_call THEN 1 END) as outbound_calls
    FROM call_metadata c
    INNER JOIN team_agents ta ON c.agent_user_id = ta.agent_user_id
    WHERE c.call_date BETWEEN p_start_date AND p_end_date
  ),
  agent_breakdown AS (
    SELECT
      json_agg(
        json_build_object(
          'agent_user_id', ab.agent_user_id,
          'agent_name', COALESCE(a.first_name, a.email, ab.agent_user_id),
          'call_count', ab.call_count,
          'avg_duration_seconds', ab.avg_duration_seconds,
          'avg_talk_percentage', ab.avg_talk_percentage
        )
        ORDER BY ab.call_count DESC
      ) as breakdown
    FROM (
      SELECT
        c.agent_user_id,
        COUNT(*) as call_count,
        AVG(c.total_duration_seconds) as avg_duration_seconds,
        AVG(c.agent_talk_percentage) as avg_talk_percentage
      FROM call_metadata c
      INNER JOIN team_agents ta ON c.agent_user_id = ta.agent_user_id
      WHERE c.call_date BETWEEN p_start_date AND p_end_date
      GROUP BY c.agent_user_id
    ) ab
    LEFT JOIN agents a ON ab.agent_user_id = a.agent_user_id
  )
  SELECT json_build_object(
    'team_id', p_team_id,
    'period', json_build_object('start_date', p_start_date, 'end_date', p_end_date),
    'summary', json_build_object(
      'total_calls', cm.total_calls,
      'active_agents', cm.active_agents,
      'total_duration_seconds', cm.total_duration_seconds,
      'avg_duration_seconds', ROUND(cm.avg_duration_seconds::numeric, 2),
      'avg_talk_percentage', ROUND(cm.avg_talk_percentage::numeric, 2),
      'inbound_calls', cm.inbound_calls,
      'outbound_calls', cm.outbound_calls
    ),
    'agent_breakdown', COALESCE(ab.breakdown, '[]'::json)
  ) INTO v_result
  FROM call_metrics cm
  CROSS JOIN agent_breakdown ab;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix get_agent_overview_metrics function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agent_overview_metrics(
  p_agent_user_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_team_id UUID;
BEGIN
  -- Get agent's team for comparison
  SELECT team_id INTO v_team_id FROM agents WHERE agent_user_id = p_agent_user_id;

  WITH agent_metrics AS (
    SELECT
      COUNT(*) as total_calls,
      COALESCE(SUM(total_duration_seconds), 0) as total_duration_seconds,
      COALESCE(AVG(total_duration_seconds), 0) as avg_duration_seconds,
      COALESCE(AVG(agent_talk_percentage), 0) as avg_talk_percentage,
      COUNT(CASE WHEN is_inbound_call THEN 1 END) as inbound_calls,
      COUNT(CASE WHEN NOT is_inbound_call THEN 1 END) as outbound_calls
    FROM call_metadata
    WHERE agent_user_id = p_agent_user_id
      AND call_date BETWEEN p_start_date AND p_end_date
  ),
  team_comparison AS (
    SELECT
      COALESCE(AVG(c.total_duration_seconds), 0) as team_avg_duration,
      COALESCE(AVG(c.agent_talk_percentage), 0) as team_avg_talk_percentage,
      COALESCE(AVG(call_count), 0) as team_avg_calls
    FROM (
      SELECT agent_user_id, AVG(total_duration_seconds) as total_duration_seconds,
             AVG(agent_talk_percentage) as agent_talk_percentage,
             COUNT(*) as call_count
      FROM call_metadata
      WHERE agent_user_id IN (SELECT agent_user_id FROM agents WHERE team_id = v_team_id)
        AND call_date BETWEEN p_start_date AND p_end_date
      GROUP BY agent_user_id
    ) c
  ),
  daily_trend AS (
    SELECT json_agg(
      json_build_object(
        'date', call_date,
        'calls', call_count,
        'avg_duration', avg_duration
      )
      ORDER BY call_date
    ) as trend
    FROM (
      SELECT
        call_date,
        COUNT(*) as call_count,
        AVG(total_duration_seconds) as avg_duration
      FROM call_metadata
      WHERE agent_user_id = p_agent_user_id
        AND call_date BETWEEN p_start_date AND p_end_date
      GROUP BY call_date
    ) d
  )
  SELECT json_build_object(
    'agent_user_id', p_agent_user_id,
    'period', json_build_object('start_date', p_start_date, 'end_date', p_end_date),
    'metrics', json_build_object(
      'total_calls', am.total_calls,
      'total_duration_seconds', am.total_duration_seconds,
      'avg_duration_seconds', ROUND(am.avg_duration_seconds::numeric, 2),
      'avg_talk_percentage', ROUND(am.avg_talk_percentage::numeric, 2),
      'inbound_calls', am.inbound_calls,
      'outbound_calls', am.outbound_calls
    ),
    'team_comparison', json_build_object(
      'team_avg_duration', ROUND(tc.team_avg_duration::numeric, 2),
      'team_avg_talk_percentage', ROUND(tc.team_avg_talk_percentage::numeric, 2),
      'team_avg_calls', ROUND(tc.team_avg_calls::numeric, 2)
    ),
    'daily_trend', COALESCE(dt.trend, '[]'::json)
  ) INTO v_result
  FROM agent_metrics am
  CROSS JOIN team_comparison tc
  CROSS JOIN daily_trend dt;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix get_call_volume_trend function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_call_volume_trend(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Cast team_id if provided
  IF p_team_id IS NOT NULL THEN
    v_team_id := p_team_id::UUID;
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'date', call_date,
        'total_calls', total_calls,
        'inbound_calls', inbound_calls,
        'outbound_calls', outbound_calls,
        'avg_duration_seconds', avg_duration_seconds
      )
      ORDER BY call_date
    )
    FROM (
      SELECT
        c.call_date,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN c.is_inbound_call THEN 1 END) as inbound_calls,
        COUNT(CASE WHEN NOT c.is_inbound_call THEN 1 END) as outbound_calls,
        ROUND(AVG(c.total_duration_seconds)::numeric, 2) as avg_duration_seconds
      FROM call_metadata c
      LEFT JOIN agents a ON c.agent_user_id = a.agent_user_id
      WHERE (p_agent_user_id IS NULL OR c.agent_user_id = p_agent_user_id)
        AND (v_team_id IS NULL OR a.team_id = v_team_id)
        AND (p_start_date IS NULL OR c.call_date >= p_start_date)
        AND (p_end_date IS NULL OR c.call_date <= p_end_date)
      GROUP BY c.call_date
    ) trend
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix get_goals_progress function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_goals_progress(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id TEXT DEFAULT NULL,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS SETOF agent_goals AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Cast team_id if provided
  IF p_team_id IS NOT NULL THEN
    v_team_id := p_team_id::UUID;
  END IF;

  RETURN QUERY
  SELECT *
  FROM agent_goals g
  WHERE (p_agent_user_id IS NULL OR g.agent_user_id = p_agent_user_id)
    AND (v_team_id IS NULL OR g.team_id = v_team_id)
    AND (p_period_start IS NULL OR g.period_end >= p_period_start)
    AND (p_period_end IS NULL OR g.period_start <= p_period_end)
  ORDER BY g.period_start DESC, g.goal_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix get_objection_summary function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_objection_summary(
  p_agent_user_id TEXT DEFAULT NULL,
  p_team_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_team_id UUID;
BEGIN
  -- Cast team_id if provided
  IF p_team_id IS NOT NULL THEN
    v_team_id := p_team_id::UUID;
  END IF;

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
        WHERE (p_agent_user_id IS NULL OR o.agent_user_id = p_agent_user_id)
          AND (v_team_id IS NULL OR a.team_id = v_team_id)
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
      WHERE (p_agent_user_id IS NULL OR o.agent_user_id = p_agent_user_id)
        AND (v_team_id IS NULL OR a.team_id = v_team_id)
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date + INTERVAL '1 day')
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$ LANGUAGE plpgsql;
