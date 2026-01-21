import React from 'react';
import type { ObjectionItem } from '../../../types';

interface ObjectionDetailListProps {
  objections: ObjectionItem[];
  overallStats: {
    totalObjections: number;
    avgResponseQuality: number;
    overallResolutionRate: number;
  };
  loading?: boolean;
}

export const ObjectionDetailList: React.FC<ObjectionDetailListProps> = ({
  objections,
  overallStats,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-40"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (objections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Objection Handling</h3>
        <div className="text-center py-8 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No objection data available for this period</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50';
    if (score >= 3) return 'text-blue-600 bg-blue-50';
    if (score >= 2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getResolutionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Objection Handling</h3>
      </div>

      {/* Overall Stats */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900">{overallStats.totalObjections}</p>
            <p className="text-xs text-slate-500">Total Objections</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{overallStats.avgResponseQuality.toFixed(1)}</p>
            <p className="text-xs text-slate-500">Avg Response (1-5)</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${getResolutionColor(overallStats.overallResolutionRate)}`}>
              {overallStats.overallResolutionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Resolution Rate</p>
          </div>
        </div>
      </div>

      {/* Objection List */}
      <div className="divide-y divide-slate-100">
        {objections.map((objection, index) => (
          <div key={index} className="px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {objection.objectionType}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {objection.totalOccurrences}x
                  </span>
                </div>

                {/* Progress Bar for Resolution Rate */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Resolution Rate</span>
                    <span className={getResolutionColor(objection.resolutionRate)}>
                      {objection.resolutionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        objection.resolutionRate >= 80 ? 'bg-green-500' :
                        objection.resolutionRate >= 60 ? 'bg-blue-500' :
                        objection.resolutionRate >= 40 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${objection.resolutionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Score Badge */}
              <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(objection.avgScore)}`}>
                {objection.avgScore.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          Score: 1 (poor) to 5 (excellent) | Resolution Rate: % of objections successfully addressed
        </p>
      </div>
    </div>
  );
};

export default ObjectionDetailList;
