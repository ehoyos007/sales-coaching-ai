import React from 'react';
import { MetricCard } from '../../../components/Dashboard';
import { formatDuration, formatPercentage, calculateDelta } from '../../../hooks/useDashboard';
import type { CallSummaryMetrics, ComplianceMetrics } from '../../../types';

interface TeamSummaryCardsProps {
  summary: CallSummaryMetrics;
  compliance: ComplianceMetrics;
  previousPeriod: {
    totalCalls: number;
    avgDurationSeconds: number;
    avgTalkRatio: number;
  };
  loading?: boolean;
}

export const TeamSummaryCards: React.FC<TeamSummaryCardsProps> = ({
  summary,
  compliance,
  previousPeriod,
  loading = false,
}) => {
  const callsDelta = calculateDelta(summary.totalCalls, previousPeriod.totalCalls);
  const durationDelta = calculateDelta(summary.avgDurationSeconds, previousPeriod.avgDurationSeconds);
  const talkRatioDelta = calculateDelta(summary.avgTalkRatio, previousPeriod.avgTalkRatio);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Calls"
        value={summary.totalCalls.toLocaleString()}
        subtitle={`${summary.uniqueAgents || 0} active agents`}
        trend={{
          value: callsDelta.percentage,
          direction: callsDelta.trend,
          isPositive: callsDelta.trend === 'up',
        }}
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        }
      />

      <MetricCard
        title="Avg Call Duration"
        value={formatDuration(summary.avgDurationSeconds)}
        subtitle={`${formatDuration(summary.totalDurationSeconds)} total`}
        trend={{
          value: durationDelta.percentage,
          direction: durationDelta.trend,
          isPositive: durationDelta.trend === 'up',
        }}
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <MetricCard
        title="Avg Talk Ratio"
        value={formatPercentage(summary.avgTalkRatio)}
        subtitle={`Inbound: ${summary.inboundCalls} | Outbound: ${summary.outboundCalls}`}
        trend={{
          value: talkRatioDelta.percentage,
          direction: talkRatioDelta.trend,
          isPositive: talkRatioDelta.trend === 'down', // Lower talk ratio is often better
        }}
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
      />

      <MetricCard
        title="Compliance Score"
        value={compliance.avgScore.toFixed(1)}
        subtitle={`${compliance.totalAnalyzed} calls analyzed`}
        loading={loading}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};

export default TeamSummaryCards;
