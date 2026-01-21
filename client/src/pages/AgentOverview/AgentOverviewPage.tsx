import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  DateRangeFilter,
  TrendChart,
  BarChart,
  DonutChart,
  GoalProgressBar,
} from '../../components/Dashboard';
import { AgentSummaryCards } from './components/AgentSummaryCards';
import { ObjectionDetailList } from './components/ObjectionDetailList';
import {
  useDateRangeFilter,
  useAgentOverview,
  useCallVolumeTrend,
} from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';

export const AgentOverviewPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { preset, setPreset, dateRange, setDateRange } = useDateRangeFilter('month');

  const {
    data: overview,
    isLoading: isLoadingOverview,
    error: overviewError,
  } = useAgentOverview(agentId, dateRange.startDate, dateRange.endDate);

  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useCallVolumeTrend(agentId, undefined, dateRange.startDate, dateRange.endDate);

  // Transform trend data for charts
  const callCountChart = useMemo(() => {
    return trendData.map(item => ({
      date: item.callDate,
      value: item.callCount,
    }));
  }, [trendData]);

  const durationChart = useMemo(() => {
    return trendData.map(item => ({
      date: item.callDate,
      value: item.avgDurationSeconds,
    }));
  }, [trendData]);

  // Prepare call type distribution for donut chart
  const callTypeData = useMemo(() => {
    if (!overview?.summary) return [];
    return [
      { name: 'Inbound', value: overview.summary.inboundCalls, color: '#6366f1' },
      { name: 'Outbound', value: overview.summary.outboundCalls, color: '#22c55e' },
    ];
  }, [overview]);

  // Weekly breakdown for bar chart
  const weeklyData = useMemo(() => {
    if (!trendData.length) return [];

    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    trendData.forEach(item => {
      const day = new Date(item.callDate).getDay();
      dayTotals[day] += item.callCount;
      dayCounts[day] += 1;
    });

    return dayNames.map((name, index) => ({
      name,
      value: dayCounts[index] > 0 ? Math.round(dayTotals[index] / dayCounts[index]) : 0,
    }));
  }, [trendData]);

  // Get back link based on user role
  const getBackLink = () => {
    if (profile?.role === 'admin' || profile?.role === 'manager') {
      return '/admin';
    }
    return '/';
  };

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
            <button
              onClick={() => navigate(getBackLink())}
              className="inline-block mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Go Back
            </button>
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
                to={getBackLink()}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile?.role === 'agent' ? 'My Performance' : 'Agent Overview'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Individual performance metrics and trends
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
        <AgentSummaryCards
          summary={overview?.summary || {
            totalCalls: 0,
            totalDurationSeconds: 0,
            avgDurationSeconds: 0,
            avgTalkRatio: 0,
            inboundCalls: 0,
            outboundCalls: 0,
          }}
          compliance={overview?.compliance || {
            avgScore: 0,
            totalAnalyzed: 0,
          }}
          previousPeriod={overview?.previousPeriod || {
            totalCalls: 0,
            avgDurationSeconds: 0,
            avgTalkRatio: 0,
            avgComplianceScore: 0,
          }}
          teamComparison={overview?.teamComparison || null}
          loading={isLoadingOverview}
        />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            data={callCountChart}
            loading={isLoadingTrend}
            title="Daily Call Volume"
            valueLabel="Calls"
            height={280}
          />
          <TrendChart
            data={durationChart}
            loading={isLoadingTrend}
            title="Average Call Duration Trend"
            valueLabel="Duration (sec)"
            height={280}
            color="#22c55e"
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            data={callTypeData}
            loading={isLoadingOverview}
            title="Call Type Distribution"
            centerLabel="Total"
            centerValue={overview?.summary.totalCalls || 0}
            height={280}
          />
          <BarChart
            data={weeklyData}
            loading={isLoadingTrend}
            title="Average Calls by Day of Week"
            valueLabel="Avg Calls"
            height={280}
            showValues
          />
        </div>

        {/* Objection Handling */}
        {overview?.objections && (
          <ObjectionDetailList
            objections={overview.objections.topObjections}
            overallStats={overview.objections.overallStats}
            loading={isLoadingOverview}
          />
        )}

        {/* Goals Progress */}
        {overview?.goals && overview.goals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Personal Goals</h3>
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

        {/* Improvement Areas */}
        {overview?.improvementAreas && overview.improvementAreas.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Suggested Improvement Areas</h3>
            <div className="space-y-4">
              {overview.improvementAreas.map((area, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    area.priority === 'high' ? 'border-red-200 bg-red-50' :
                    area.priority === 'medium' ? 'border-amber-200 bg-amber-50' :
                    'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-1 rounded ${
                      area.priority === 'high' ? 'bg-red-100 text-red-600' :
                      area.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">{area.area}</h4>
                      <p className="text-sm text-slate-500 mt-1">{area.description}</p>
                      {area.suggestedActions.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {area.suggestedActions.map((action, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                              </svg>
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentOverviewPage;
