// =============================================
// DASHBOARD HOOKS - Team & Agent Overview
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';
import type {
  TeamOverviewData,
  AgentOverviewData,
  DailyTrend,
  ComplianceSummary,
  GoalProgress,
  DateRange,
  TimeRangePreset,
} from '../types';

// =============================================
// DATE RANGE HOOK
// =============================================

export function useDateRangeFilter(defaultPreset: TimeRangePreset = 'month') {
  const [preset, setPreset] = useState<TimeRangePreset>(defaultPreset);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const dateRange = useMemo((): DateRange => {
    const now = new Date();

    if (preset === 'custom' && customRange) {
      return customRange;
    }

    switch (preset) {
      case 'today': {
        const today = now.toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        };
      }
      case 'month':
      default: {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0],
        };
      }
      case 'quarter': {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          startDate: quarterStart.toISOString().split('T')[0],
          endDate: quarterEnd.toISOString().split('T')[0],
        };
      }
    }
  }, [preset, customRange]);

  const setDateRange = useCallback((range: DateRange) => {
    setPreset('custom');
    setCustomRange(range);
  }, []);

  return {
    preset,
    setPreset,
    dateRange,
    setDateRange,
  };
}

// =============================================
// TEAM OVERVIEW HOOK
// =============================================

export function useTeamOverview(teamId: string | undefined, startDate?: string, endDate?: string) {
  const [data, setData] = useState<TeamOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!teamId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getTeamOverview(teamId, {
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch team overview');
        setData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================
// AGENT OVERVIEW HOOK
// =============================================

export function useAgentOverview(agentId: string | undefined, startDate?: string, endDate?: string) {
  const [data, setData] = useState<AgentOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getAgentOverview(agentId, {
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch agent overview');
        setData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================
// CALL VOLUME TREND HOOK
// =============================================

export function useCallVolumeTrend(
  agentId?: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<DailyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getCallVolumeTrend({
        agent_id: agentId,
        team_id: teamId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch call volume trend');
        setData([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, teamId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================
// COMPLIANCE SUMMARY HOOK
// =============================================

export function useComplianceSummary(
  agentId?: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<ComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId && !teamId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getDashboardComplianceSummary({
        agent_id: agentId,
        team_id: teamId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch compliance summary');
        setData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, teamId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================
// GOALS PROGRESS HOOK
// =============================================

export function useGoalsProgress(
  agentId?: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getGoalsProgress({
        agent_id: agentId,
        team_id: teamId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch goals progress');
        setData([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, teamId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================
// PERFORMANCE DELTA UTILITY
// =============================================

export function calculateDelta(current: number, previous: number): {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
} {
  if (previous === 0) {
    return {
      value: current,
      percentage: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'stable',
    };
  }

  const difference = current - previous;
  const percentage = (difference / previous) * 100;

  return {
    value: difference,
    percentage: Math.round(percentage * 10) / 10,
    trend: percentage > 1 ? 'up' : percentage < -1 ? 'down' : 'stable',
  };
}

// =============================================
// FORMAT UTILITIES
// =============================================

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}
