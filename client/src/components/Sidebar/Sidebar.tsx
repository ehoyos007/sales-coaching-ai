import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AgentList } from './AgentList';
import { QuickActions } from './QuickActions';
import { useAuth } from '../../hooks/useAuth';
import type { Agent } from '../../types';

interface SidebarProps {
  agents: Agent[];
  isLoadingAgents: boolean;
  agentsError: string | null;
  selectedAgentId?: string;
  isOpen: boolean;
  isChatLoading?: boolean;
  onClose: () => void;
  onAgentSelect: (agent: Agent) => void;
  onQuickAction: (prompt: string) => void;
}

type SidebarTab = 'actions' | 'agents';

export const Sidebar: React.FC<SidebarProps> = ({
  agents,
  isLoadingAgents,
  agentsError,
  selectedAgentId,
  isOpen,
  isChatLoading = false,
  onClose,
  onAgentSelect,
  onQuickAction,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('actions');
  const { profile } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-600 text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="font-semibold text-slate-800">Sales Coach</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth"
            aria-label="Close sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-3 text-sm font-medium transition-smooth ${
              activeTab === 'actions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Quick Actions
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 py-3 text-sm font-medium transition-smooth ${
              activeTab === 'agents'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Agents ({Array.isArray(agents) ? agents.length : 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'actions' ? (
            <QuickActions onActionClick={onQuickAction} isLoading={isChatLoading} />
          ) : (
            <AgentList
              agents={agents}
              isLoading={isLoadingAgents}
              error={agentsError}
              selectedAgentId={selectedAgentId}
              isChatLoading={isChatLoading}
              onAgentSelect={onAgentSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 space-y-2">
          {/* My Performance link - available to all roles */}
          {profile && (
            <Link
              to={`/agents/${profile.id}/overview`}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              My Performance
            </Link>
          )}

          {/* Admin Panel link - admin only */}
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Admin Panel
            </Link>
          )}

          {/* Rubric Settings - manager/admin */}
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <Link
              to="/settings/rubric"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Rubric Settings
            </Link>
          )}

          <p className="text-xs text-slate-500 text-center pt-2">
            Powered by AI | v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
