import React from 'react';
import { MetricCard, ComplianceScoreCircle } from '../../../components/Dashboard';
import { formatDuration, formatPercentage, calculateDelta } from '../../../hooks/useDashboard';
import type { CallSummaryMetrics, ComplianceMetrics, TeamComparison } from '../../../types';

interface AgentSummaryCardsProps {
  summary: CallSummaryMetrics;
  compliance: ComplianceMetrics;
  previousPeriod: {
    totalCalls: number;
    avgDurationSeconds: number;
    avgTalkRatio: number;
    avgComplianceScore: number;
  };
  teamComparison: TeamComparison | null;
  loading?: boolean;
}

export const AgentSummaryCards: React.FC<AgentSummaryCardsProps> = ({
  summary,
  compliance,
  previousPeriod,
  teamComparison,
  loading = false,
}) => {
  const callsDelta = calculateDelta(summary.totalCalls, previousPeriod.totalCalls);
  const durationDelta = calculateDelta(summary.avgDurationSeconds, previousPeriod.avgDurationSeconds);
  const talkRatioDelta = calculateDelta(summary.avgTalkRatio, previousPeriod.avgTalkRatio);
  const complianceDelta = calculateDelta(compliance.avgScore, previousPeriod.avgComplianceScore);

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Calls"
          value={summary.totalCalls.toLocaleString()}
          subtitle={`${summary.inboundCalls} in / ${summary.outboundCalls} out`}
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
          title="Talk Ratio"
          value={formatPercentage(summary.avgTalkRatio)}
          subtitle={summary.avgTalkRatio > 60 ? 'Consider letting customer talk more' : 'Good balance'}
          trend={{
            value: talkRatioDelta.percentage,
            direction: talkRatioDelta.trend,
            isPositive: talkRatioDelta.trend === 'down',
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
          trend={{
            value: complianceDelta.percentage,
            direction: complianceDelta.trend,
            isPositive: complianceDelta.trend === 'up',
          }}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Team Comparison Banner */}
      {teamComparison && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Team Comparison</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <ComparisonMetric
              label="Calls"
              agentValue={summary.totalCalls}
              teamAvg={teamComparison.teamAvgCalls}
              percentile={teamComparison.agentPercentileCalls}
            />
            <ComparisonMetric
              label="Duration"
              agentValue={summary.avgDurationSeconds}
              teamAvg={teamComparison.teamAvgDuration}
              format="duration"
            />
            <ComparisonMetric
              label="Talk Ratio"
              agentValue={summary.avgTalkRatio}
              teamAvg={teamComparison.teamAvgTalkRatio}
              format="percentage"
              lowerIsBetter
            />
            <ComparisonMetric
              label="Compliance"
              agentValue={compliance.avgScore}
              teamAvg={teamComparison.teamAvgCompliance}
              percentile={teamComparison.agentPercentileCompliance}
            />
          </div>
        </div>
      )}

      {/* Compliance Score Visual */}
      {compliance.totalAnalyzed > 0 && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-6">
            <ComplianceScoreCircle score={compliance.avgScore} size={120} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Compliance Overview</h3>
              <p className="text-sm text-slate-500 mb-4">
                Based on {compliance.totalAnalyzed} analyzed calls this period.
              </p>
              {compliance.violations && compliance.violations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase">Top Violations</p>
                  {compliance.violations.slice(0, 3).map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{v.category}</span>
                      <span className={`font-medium ${
                        v.severity === 'critical' ? 'text-red-600' :
                        v.severity === 'high' ? 'text-orange-600' :
                        v.severity === 'medium' ? 'text-amber-600' :
                        'text-slate-500'
                      }`}>
                        {v.count} occurrences
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for team comparison
interface ComparisonMetricProps {
  label: string;
  agentValue: number;
  teamAvg: number;
  percentile?: number;
  format?: 'number' | 'duration' | 'percentage';
  lowerIsBetter?: boolean;
}

const ComparisonMetric: React.FC<ComparisonMetricProps> = ({
  label,
  agentValue,
  teamAvg,
  percentile,
  format = 'number',
  lowerIsBetter = false,
}) => {
  const formatValue = (value: number) => {
    switch (format) {
      case 'duration':
        if (value < 60) return `${Math.round(value)}s`;
        return `${Math.floor(value / 60)}m`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toFixed(1);
    }
  };

  const isAboveAverage = lowerIsBetter ? agentValue < teamAvg : agentValue > teamAvg;

  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${isAboveAverage ? 'text-green-600' : 'text-slate-900'}`}>
        {formatValue(agentValue)}
      </p>
      <p className="text-xs text-slate-400">
        Team avg: {formatValue(teamAvg)}
      </p>
      {percentile !== undefined && (
        <p className="text-xs font-medium text-primary-600 mt-1">
          Top {((1 - percentile) * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
};

export default AgentSummaryCards;
