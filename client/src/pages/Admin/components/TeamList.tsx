import React, { useState } from 'react';
import type { Team } from '../../../types';

interface TeamListProps {
  teams: Team[];
  onCreateTeam: (name: string, description?: string) => Promise<void>;
  isCreating: boolean;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onCreateTeam,
  isCreating,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await onCreateTeam(newTeamName.trim(), newTeamDescription.trim() || undefined);
    setNewTeamName('');
    setNewTeamDescription('');
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setNewTeamName('');
    setNewTeamDescription('');
    setShowCreateForm(false);
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
            Manage teams and their members.
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
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
        <div className="space-y-3">
          {teams.map(team => (
            <div
              key={team.id}
              className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Team Icon */}
                  <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-primary-600"
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
                  <div>
                    <h4 className="font-medium text-slate-900">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Created: {formatDate(team.created_at)}</span>
                      {team.member_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
                            />
                          </svg>
                          {team.member_count}{' '}
                          {team.member_count === 1 ? 'member' : 'members'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Count Badge */}
                {team.member_count !== undefined && (
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded-full">
                      {team.member_count}{' '}
                      {team.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
        </ul>
      </div>
    </div>
  );
};

export default TeamList;
