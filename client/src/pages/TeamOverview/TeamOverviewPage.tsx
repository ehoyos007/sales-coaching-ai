import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DateRangeFilter,
  TrendChart,
  BarChart,
  DonutChart,
  GoalProgressBar,
} from '../../components/Dashboard';
import { TeamSummaryCards } from './components/TeamSummaryCards';
import { AgentBreakdownTable } from './components/AgentBreakdownTable';
import {
  useDateRangeFilter,
  useTeamOverview,
  useCallVolumeTrend,
} from '../../hooks/useDashboard';

export const TeamOverviewPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { preset, setPreset, dateRange, setDateRange } = useDateRangeFilter('month');

  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: overviewError,
  } = useTeamOverview(teamId, dateRange.startDate, dateRange.endDate);

  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useCallVolumeTrend(undefined, teamId, dateRange.startDate, dateRange.endDate);

  // Transform trend data for chart
  const chartData = useMemo(() => {
    return trendData.map(item => ({
      date: item.callDate,
      value: item.callCount,
    }));
  }, [trendData]);

  // Prepare agent talk ratio distribution for bar chart
  const talkRatioData = useMemo(() => {
    if (!overview?.agentBreakdown) return [];
    return overview.agentBreakdown
      .slice(0, 10)
      .map(agent => ({
        name: agent.firstName || agent.email?.split('@')[0] || 'Unknown',
        value: Math.round(agent.avgTalkRatio),
      }));
  }, [overview]);

  // Prepare inbound/outbound data for donut chart
  const callTypeData = useMemo(() => {
    if (!overview?.summary) return [];
    return [
      { name: 'Inbound', value: overview.summary.inboundCalls, color: '#6366f1' },
      { name: 'Outbound', value: overview.summary.outboundCalls, color: '#22c55e' },
    ];
  }, [overview]);

  // Prepare objection data for bar chart
  const objectionData = useMemo(() => {
    if (!overview?.objections?.topObjections) return [];
    return overview.objections.topObjections.slice(0, 5).map(obj => ({
      name: obj.objectionType,
      value: obj.totalOccurrences,
    }));
  }, [overview]);

  if (overviewError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{overviewError}</p>
            <Link
              to="/admin"
              className="inline-block mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Team Overview</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Performance metrics and analytics
                </p>
              </div>
            </div>
            <DateRangeFilter
              preset={preset}
              dateRange={dateRange}
              onPresetChange={setPreset}
              onCustomRangeChange={setDateRange}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <TeamSummaryCards
          summary={overview?.summary || {
            totalCalls: 0,
            totalDurationSeconds: 0,
            avgDurationSeconds: 0,
            avgTalkRatio: 0,
            inboundCalls: 0,
            outboundCalls: 0,
            uniqueAgents: 0,
          }}
          compliance={overview?.compliance || {
            avgScore: 0,
            totalAnalyzed: 0,
          }}
          previousPeriod={overview?.previousPeriod || {
            totalCalls: 0,
            avgDurationSeconds: 0,
            avgTalkRatio: 0,
          }}
          loading={isLoadingOverview}
        />

        {/* Agent Breakdown Table */}
        <AgentBreakdownTable
          agents={overview?.agentBreakdown || []}
          loading={isLoadingOverview}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            data={chartData}
            loading={isLoadingTrend}
            title="Call Volume Trend"
            valueLabel="Calls"
            height={280}
          />
          <DonutChart
            data={callTypeData}
            loading={isLoadingOverview}
            title="Call Type Distribution"
            centerLabel="Total"
            centerValue={overview?.summary.totalCalls || 0}
            height={280}
          />
        </div>

        {/* Talk Ratio Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            data={talkRatioData}
            loading={isLoadingOverview}
            title="Agent Talk Ratio Distribution"
            valueLabel="Talk %"
            height={280}
            horizontal
          />

          {/* Objection Handling */}
          <BarChart
            data={objectionData}
            loading={isLoadingOverview}
            title="Top Objections Encountered"
            valueLabel="Count"
            height={280}
            horizontal
            color="#f59e0b"
          />
        </div>

        {/* Goals Progress */}
        {overview?.goals && overview.goals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Team Goals Progress</h3>
            <div className="space-y-4">
              {overview.goals.map(goal => (
                <GoalProgressBar
                  key={goal.id}
                  goalType={goal.goalType}
                  targetValue={goal.targetValue}
                  actualValue={goal.actualValue}
                  progressPercentage={goal.progressPercentage}
                  periodStart={goal.periodStart}
                  periodEnd={goal.periodEnd}
                />
              ))}
            </div>
          </div>
        )}

        {/* Objection Stats Summary */}
        {overview?.objections && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Objection Handling Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {overview.objections.overallStats.totalObjections}
                </p>
                <p className="text-sm text-slate-500">Total Objections</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">
                  {overview.objections.overallStats.avgResponseQuality.toFixed(1)}
                </p>
                <p className="text-sm text-slate-500">Avg Response Quality</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {overview.objections.overallStats.overallResolutionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">Resolution Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamOverviewPage;
