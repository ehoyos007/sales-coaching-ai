import React, { useState } from 'react';
import { AgentList } from './AgentList';
import { QuickActions } from './QuickActions';
import type { Agent } from '../../types';

interface SidebarProps {
  agents: Agent[];
  isLoadingAgents: boolean;
  agentsError: string | null;
  selectedAgentId?: string;
  isOpen: boolean;
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
  onClose,
  onAgentSelect,
  onQuickAction,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('actions');

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
            Agents ({agents.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'actions' ? (
            <QuickActions onActionClick={onQuickAction} />
          ) : (
            <AgentList
              agents={agents}
              isLoading={isLoadingAgents}
              error={agentsError}
              selectedAgentId={selectedAgentId}
              onAgentSelect={onAgentSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Powered by AI | v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
