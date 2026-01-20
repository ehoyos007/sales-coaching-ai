import { useState, useEffect, useCallback } from 'react';
import { getAgents, getAgentCalls, getAgentPerformance } from '../services/api';
import type { Agent, CallSummary, AgentPerformance } from '../types';

interface UseAgentsReturn {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    isLoading,
    error,
    refetch: fetchAgents,
  };
}

interface UseAgentCallsParams {
  agentId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface UseAgentCallsReturn {
  calls: CallSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentCalls({
  agentId,
  startDate,
  endDate,
  limit,
}: UseAgentCallsParams): UseAgentCallsReturn {
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!agentId) {
      setCalls([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAgentCalls(agentId, {
        start_date: startDate,
        end_date: endDate,
        limit,
      });

      if (response.success && response.data) {
        setCalls(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch calls');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calls');
    } finally {
      setIsLoading(false);
    }
  }, [agentId, startDate, endDate, limit]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return {
    calls,
    isLoading,
    error,
    refetch: fetchCalls,
  };
}

interface UseAgentPerformanceParams {
  agentId: string;
  startDate?: string;
  endDate?: string;
}

interface UseAgentPerformanceReturn {
  performance: AgentPerformance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentPerformance({
  agentId,
  startDate,
  endDate,
}: UseAgentPerformanceParams): UseAgentPerformanceReturn {
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!agentId) {
      setPerformance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAgentPerformance(agentId, {
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success && response.data) {
        setPerformance(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch performance');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch performance'
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentId, startDate, endDate]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    isLoading,
    error,
    refetch: fetchPerformance,
  };
}

export default useAgents;
