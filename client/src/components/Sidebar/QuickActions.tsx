import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

interface QuickActionsProps {
  onActionClick: (prompt: string) => void;
  isLoading?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'team-summary',
    label: 'Team Summary',
    prompt: 'Give me a summary of the team performance this week',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
  },
  {
    id: 'top-performers',
    label: 'Top Performers',
    prompt: 'Who are the top performing agents this month?',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    ),
  },
  {
    id: 'recent-calls',
    label: 'Recent Calls',
    prompt: "Show me the most recent calls from today",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    ),
  },
  {
    id: 'talk-ratio',
    label: 'Talk Ratio Analysis',
    prompt: 'Which agents have the highest talk time ratio?',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    id: 'long-calls',
    label: 'Long Calls',
    prompt: 'Show me calls longer than 10 minutes',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    id: 'coaching-tips',
    label: 'Coaching Tips',
    prompt: 'What coaching recommendations do you have based on recent call data?',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick, isLoading = false }) => {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Quick Actions
      </p>
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.prompt)}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600"
          aria-busy={isLoading}
        >
          <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {action.icon}
            </svg>
          </div>
          <span className="text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
