import React, { useState } from 'react';
import type { UserProfile, UserRole, Team } from '../../../types';

interface UserTableProps {
  users: UserProfile[];
  teams: Team[];
  onUpdateRole: (userId: string, role: UserRole) => Promise<void>;
  onUpdateTeam: (userId: string, teamId: string | null) => Promise<void>;
  isUpdating: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  teams,
  onUpdateRole,
  onUpdateTeam,
  isUpdating,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('agent');
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  const getRoleBadgeStyles = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agent':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeStyles = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const handleEditClick = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditTeamId(user.team_id);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditRole('agent');
    setEditTeamId(null);
  };

  const handleSaveEdit = async (user: UserProfile) => {
    if (editRole !== user.role) {
      await onUpdateRole(user.id, editRole);
    }
    if (editTeamId !== user.team_id) {
      await onUpdateTeam(user.id, editTeamId);
    }
    setEditingUserId(null);
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'No Team';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (users.length === 0) {
    return (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              User
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              Role
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              Team
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
              Joined
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const isEditing = editingUserId === user.id;
            const isAdmin = user.role === 'admin';

            return (
              <tr
                key={user.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {/* User Info */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {(user.first_name ?? '?').charAt(0).toUpperCase()}
                        {user.last_name?.charAt(0).toUpperCase() ?? ''}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.first_name} {user.last_name || ''}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="py-4 px-4">
                  {isEditing && !isAdmin ? (
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as UserRole)}
                      className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeStyles(
                        user.role
                      )}`}
                    >
                      {(user.role ?? 'unknown').charAt(0).toUpperCase() + (user.role ?? 'unknown').slice(1)}
                    </span>
                  )}
                </td>

                {/* Team */}
                <td className="py-4 px-4">
                  {isEditing ? (
                    <select
                      value={editTeamId || ''}
                      onChange={e =>
                        setEditTeamId(e.target.value || null)
                      }
                      className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">No Team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-slate-600">
                      {getTeamName(user.team_id)}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeStyles(
                      user.is_active
                    )}`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Joined Date */}
                <td className="py-4 px-4">
                  <span className="text-sm text-slate-500">
                    {formatDate(user.created_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(user)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(user)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
