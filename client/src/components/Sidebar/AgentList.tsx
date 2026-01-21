import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Agent } from '../../types';

interface AgentListProps {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  selectedAgentId?: string;
  isChatLoading?: boolean;
  onAgentSelect: (agent: Agent) => void;
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  isLoading,
  error,
  selectedAgentId,
  isChatLoading = false,
  onAgentSelect,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-slate-500">Loading agents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-sm text-red-500 mb-2">Failed to load agents</p>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }

  // Ensure agents is an array
  const agentsList = Array.isArray(agents) ? agents : [];

  if (agentsList.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-slate-500">No agents found</p>
      </div>
    );
  }

  // Group agents by department
  const agentsByDepartment = agentsList.reduce(
    (acc, agent) => {
      const dept = agent.department || 'Other';
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(agent);
      return acc;
    },
    {} as Record<string, Agent[]>
  );

  const sortedDepartments = Object.keys(agentsByDepartment).sort();

  return (
    <div className="space-y-4">
      {sortedDepartments.map((department) => (
        <div key={department}>
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {department}
          </p>
          <div className="space-y-1">
            {agentsByDepartment[department].map((agent) => (
              <button
                key={agent.agent_user_id}
                onClick={() => onAgentSelect(agent)}
                disabled={isChatLoading}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-smooth disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedAgentId === agent.agent_user_id
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-slate-100 text-slate-700 disabled:hover:bg-transparent'
                }`}
                aria-busy={isChatLoading}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedAgentId === agent.agent_user_id
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(agent.first_name || agent.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {agent.first_name || agent.email || 'Unknown Agent'}
                  </p>
                  {agent.extension && (
                    <p className="text-xs text-slate-500">
                      Ext. {agent.extension}
                    </p>
                  )}
                </div>
                {agent.active && (
                  <span className="flex-shrink-0 h-2 w-2 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentList;
