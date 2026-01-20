import React from 'react';
import type { CallMetadata } from '../../types';

interface CallMetricsProps {
  callDetails: CallMetadata;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'slate';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  slate: 'bg-slate-100 text-slate-600',
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4">
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center h-10 w-10 rounded-lg ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

export const CallMetrics: React.FC<CallMetricsProps> = ({ callDetails }) => {
  const metrics: MetricCardProps[] = [
    {
      label: 'Duration',
      value: callDetails.total_duration_formatted,
      color: 'blue',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Total Turns',
      value: callDetails.total_turns,
      color: 'green',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      label: 'Agent Talk',
      value: `${callDetails.agent_talk_percentage}%`,
      color: 'purple',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      label: 'Customer Talk',
      value: `${callDetails.customer_talk_percentage}%`,
      color: 'orange',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                callDetails.is_inbound_call
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {callDetails.is_inbound_call ? 'Inbound' : 'Outbound'}
            </span>
            {callDetails.is_redacted && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                Redacted
              </span>
            )}
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-medium">Date: </span>
            {new Date(callDetails.call_datetime).toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
          {callDetails.department && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Department: </span>
              {callDetails.department}
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Talk ratio bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
          Talk Ratio Distribution
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-purple-600 w-16">Agent</span>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${callDetails.agent_talk_percentage}%` }}
              />
              <div
                className="bg-orange-400 h-full transition-all duration-500"
                style={{ width: `${callDetails.customer_talk_percentage}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-orange-600 w-16 text-right">
            Customer
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-500">
            {callDetails.agent_turns} turns
          </span>
          <span className="text-xs text-slate-500">
            {callDetails.customer_turns} turns
          </span>
        </div>
      </div>

      {/* Call ID */}
      <div className="text-xs text-slate-400 text-center">
        Call ID: {callDetails.call_id}
      </div>
    </div>
  );
};

export default CallMetrics;
