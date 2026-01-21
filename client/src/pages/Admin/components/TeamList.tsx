import React, { useState, useEffect, useRef } from 'react';
import type { Team, UserProfile } from '../../../types';

interface TeamListProps {
  teams: Team[];
  users: UserProfile[];
  managers: UserProfile[];
  onCreateTeam: (name: string, description?: string, managerId?: string) => Promise<void>;
  onUpdateTeam: (teamId: string, updates: { name?: string; description?: string; manager_id?: string | null }) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
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
  managers,
  onCreateTeam,
  onUpdateTeam,
  isCreating,
  isUpdating,
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
          <li>- Teams help organize users for better management</li>
          <li>- Users can be assigned to teams from the Users tab</li>
          <li>- Managers can view performance data for their team members</li>
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
            className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl"
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

              {/* Team Stats */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Members:</span>
                  <span className="font-medium text-slate-900">{editingTeam.member_count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-medium text-slate-900">{formatDate(editingTeam.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating || !editName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamList;
