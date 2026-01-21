import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Team, UserProfile, Agent } from '../../../types';

interface TeamListProps {
  teams: Team[];
  users: UserProfile[];
  agents: Agent[];
  managers: UserProfile[];
  onCreateTeam: (name: string, description?: string, managerId?: string) => Promise<void>;
  onUpdateTeam: (teamId: string, updates: { name?: string; description?: string; manager_id?: string | null }) => Promise<void>;
  onUpdateAgentTeam: (agentUserId: string, teamId: string | null) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Helper to get manager display name
const getManagerDisplayName = (managerId: string | null, users: UserProfile[]): string => {
  if (!managerId) return 'No manager assigned';
  const manager = users.find(u => u.id === managerId);
  if (!manager) return 'Unknown';
  if (manager.first_name) {
    return `${manager.first_name} ${manager.last_name || ''}`.trim();
  }
  return manager.email.split('@')[0];
};

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  users,
  agents,
  managers,
  onCreateTeam,
  onUpdateTeam,
  onUpdateAgentTeam,
  onDeleteTeam,
  isCreating,
  isUpdating,
  isDeleting,
}) => {
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamManagerId, setNewTeamManagerId] = useState('');

  // Edit modal state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editManagerId, setEditManagerId] = useState('');

  // Member management state
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key for modal
  useEffect(() => {
    if (editingTeam) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditingTeam(null);
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [editingTeam]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await onCreateTeam(
      newTeamName.trim(),
      newTeamDescription.trim() || undefined,
      newTeamManagerId || undefined
    );
    setNewTeamName('');
    setNewTeamDescription('');
    setNewTeamManagerId('');
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setNewTeamName('');
    setNewTeamDescription('');
    setNewTeamManagerId('');
    setShowCreateForm(false);
  };

  const handleTeamClick = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditDescription(team.description || '');
    setEditManagerId(team.manager_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTeam || !editName.trim()) return;

    const updates: { name?: string; description?: string; manager_id?: string | null } = {};

    if (editName.trim() !== editingTeam.name) {
      updates.name = editName.trim();
    }
    if (editDescription.trim() !== (editingTeam.description || '')) {
      updates.description = editDescription.trim();
    }
    if (editManagerId !== (editingTeam.manager_id || '')) {
      updates.manager_id = editManagerId || null;
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await onUpdateTeam(editingTeam.id, updates);
    }

    setEditingTeam(null);
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingTeam) return;
    await onDeleteTeam(editingTeam.id);
    setEditingTeam(null);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAgentDisplayName = (agent: Agent): string => {
    return agent.first_name || agent.email?.split('@')[0] || 'Unknown';
  };

  const getAgentInitials = (agent: Agent): string => {
    if (agent.first_name) {
      const parts = agent.first_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return agent.first_name.slice(0, 2).toUpperCase();
    }
    if (agent.email) {
      return agent.email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const handleAddMember = async (agentUserId: string) => {
    if (!editingTeam) return;
    setUpdatingMemberId(agentUserId);
    try {
      await onUpdateAgentTeam(agentUserId, editingTeam.id);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (agentUserId: string) => {
    setUpdatingMemberId(agentUserId);
    try {
      await onUpdateAgentTeam(agentUserId, null);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Get team members and available agents for the editing team (from agents table)
  const teamMembers = editingTeam
    ? agents.filter(a => a.team_id === editingTeam.id)
    : [];
  const availableAgents = editingTeam
    ? agents.filter(a => a.team_id !== editingTeam.id)
    : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Teams</h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage teams and their members. Click a team to edit.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Team
          </button>
        )}
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-primary-200 bg-primary-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-900 mb-4">
            Create New Team
          </h4>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="team-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Team Name *
              </label>
              <input
                id="team-name"
                type="text"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g., Enterprise Sales"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="team-description"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="team-description"
                value={newTeamDescription}
                onChange={e => setNewTeamDescription(e.target.value)}
                placeholder="Brief description of the team..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="team-manager"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Team Manager (optional)
              </label>
              <select
                id="team-manager"
                value={newTeamManagerId}
                onChange={e => setNewTeamManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No manager assigned</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.first_name
                      ? `${manager.first_name} ${manager.last_name || ''}`.trim()
                      : manager.email.split('@')[0]}
                    {' '}({manager.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleCancelCreate}
                disabled={isCreating}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={isCreating || !newTeamName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg
            className="h-12 w-12 mx-auto mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mb-4">No teams created yet</p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Create Your First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team)}
              className="text-left border border-slate-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Team Icon */}
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>

                  {/* Team Info */}
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Member Count Badge */}
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full flex-shrink-0">
                  {team.member_count ?? 0}
                </span>
              </div>

              {/* Manager and Date */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">
                    Manager: {getManagerDisplayName(team.manager_id, users)}
                  </span>
                  <span className="flex-shrink-0 ml-2">
                    {formatDate(team.created_at)}
                  </span>
                </div>
              </div>

              {/* Dashboard Link */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  to={`/teams/${team.id}/overview`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Dashboard
                </Link>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          About Teams
        </h4>
        <ul className="text-sm text-slate-500 space-y-1">
          <li>- Teams help organize sales agents for better management</li>
          <li>- Click a team card to add or remove agents</li>
          <li>- Managers can view performance data for their team's agents</li>
          <li>- Assign a manager to receive team performance reports</li>
        </ul>
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-team-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancelEdit}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 id="edit-team-title" className="text-lg font-semibold text-slate-900">
                Edit Team
              </h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
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

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="edit-team-name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Team Name *
                </label>
                <input
                  id="edit-team-name"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g., Enterprise Sales"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-team-description"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="edit-team-description"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Brief description of the team..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-team-manager"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Team Manager
                </label>
                <select
                  id="edit-team-manager"
                  value={editManagerId}
                  onChange={e => setEditManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">No manager assigned</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.first_name
                        ? `${manager.first_name} ${manager.last_name || ''}`.trim()
                        : manager.email.split('@')[0]}
                      {' '}({manager.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Members Section (Sales Agents) */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Sales Agents ({teamMembers.length})
                </h3>

                {/* Add Agent Dropdown */}
                <div className="mb-3">
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAddMember(e.target.value);
                      }
                    }}
                    disabled={availableAgents.length === 0 || updatingMemberId !== null}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {availableAgents.length === 0
                        ? 'All agents assigned to teams'
                        : 'Add agent to team...'}
                    </option>
                    {availableAgents.map(agent => (
                      <option key={agent.agent_user_id} value={agent.agent_user_id}>
                        {getAgentDisplayName(agent)} {agent.email ? `(${agent.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member List */}
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4 text-center">
                    No agents in this team yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {teamMembers.map(member => (
                      <div
                        key={member.agent_user_id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                            {getAgentInitials(member)}
                          </div>
                          {/* Info */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {getAgentDisplayName(member)}
                            </p>
                            {member.email && (
                              <p className="text-xs text-slate-500 truncate">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveMember(member.agent_user_id)}
                          disabled={updatingMemberId === member.agent_user_id}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {updatingMemberId === member.agent_user_id ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Stats */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Agents:</span>
                  <span className="font-medium text-slate-900">{teamMembers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-medium text-slate-900">{formatDate(editingTeam.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              {/* Delete button on the left */}
              {!showDeleteConfirm ? (
                <button
                  onClick={handleDeleteClick}
                  disabled={isUpdating || isDeleting}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete Team
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete this team?</span>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Save/Cancel on the right */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating || isDeleting}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || isDeleting || !editName.trim()}
                  className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamList;
