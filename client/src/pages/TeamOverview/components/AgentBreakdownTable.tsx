import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ComplianceIndicator } from '../../../components/Dashboard';
import { formatDuration, formatPercentage } from '../../../hooks/useDashboard';
import type { AgentBreakdown } from '../../../types';

interface AgentBreakdownTableProps {
  agents: AgentBreakdown[];
  loading?: boolean;
}

export const AgentBreakdownTable: React.FC<AgentBreakdownTableProps> = ({
  agents,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (agent: AgentBreakdown) => {
    navigate(`/agents/${agent.agentUserId}/overview`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Agent Performance Breakdown</h3>
        </div>
        <div className="p-5">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Agent Performance Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Calls
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Talk Ratio
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Compliance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No agent data available for this period
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr
                  key={agent.agentUserId}
                  onClick={() => handleRowClick(agent)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
                        {getInitials(agent.firstName, agent.email)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {agent.firstName || agent.email?.split('@')[0] || 'Unknown'}
                        </p>
                        {agent.email && (
                          <p className="text-xs text-slate-400">{agent.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-right">
                    <span className="font-semibold text-slate-900">
                      {agent.totalCalls.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-right text-slate-700">
                    {formatDuration(agent.avgDuration)}
                  </td>
                  <td className="px-5 py-4 text-sm text-right">
                    <span className={
                      agent.avgTalkRatio > 70 ? 'text-amber-600' :
                      agent.avgTalkRatio < 40 ? 'text-green-600' :
                      'text-slate-700'
                    }>
                      {formatPercentage(agent.avgTalkRatio)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-right">
                    <ComplianceIndicator score={agent.avgComplianceScore} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function getInitials(firstName: string | null, email: string | null): string {
  if (firstName) {
    const parts = firstName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

export default AgentBreakdownTable;
