import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserTable, TeamList } from './components';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  getAdminUsers,
  getAdminTeams,
  getAdminAgents,
  updateUserRole,
  updateUserTeam,
  updateAgentTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../../services/api';
import type { UserProfile, UserRole, Team, Agent } from '../../types';

type TabId = 'users' | 'teams';

export const AdminPage: React.FC = () => {
  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('users');

  // Fetch users, teams, and agents on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [usersResponse, teamsResponse, agentsResponse] = await Promise.all([
          getAdminUsers(),
          getAdminTeams(),
          getAdminAgents(),
        ]);

        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data.users);
        } else {
          throw new Error(usersResponse.error || 'Failed to fetch users');
        }

        if (teamsResponse.success && teamsResponse.data) {
          setTeams(teamsResponse.data.teams);
        } else {
          throw new Error(teamsResponse.error || 'Failed to fetch teams');
        }

        if (agentsResponse.success && agentsResponse.data) {
          setAgents(agentsResponse.data.agents);
        } else {
          throw new Error(agentsResponse.error || 'Failed to fetch agents');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle role update
  const handleUpdateRole = useCallback(
    async (userId: string, role: UserRole) => {
      setIsUpdatingUser(true);
      setError(null);

      try {
        const response = await updateUserRole(userId, role);

        if (response.success && response.data) {
          // Update the user in the local state
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? response.data!.profile : user
            )
          );
        } else {
          throw new Error(response.error || 'Failed to update role');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update role');
      } finally {
        setIsUpdatingUser(false);
      }
    },
    []
  );

  // Handle team assignment
  const handleUpdateTeam = useCallback(
    async (userId: string, teamId: string | null) => {
      setIsUpdatingUser(true);
      setError(null);

      try {
        const response = await updateUserTeam(userId, teamId);

        if (response.success && response.data) {
          // Update the user in the local state
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? response.data!.profile : user
            )
          );

          // Refresh teams to update member counts
          const teamsResponse = await getAdminTeams();
          if (teamsResponse.success && teamsResponse.data) {
            setTeams(teamsResponse.data.teams);
          }
        } else {
          throw new Error(response.error || 'Failed to update team');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update team');
      } finally {
        setIsUpdatingUser(false);
      }
    },
    []
  );

  // Handle team creation
  const handleCreateTeam = useCallback(
    async (name: string, description?: string, managerId?: string) => {
      setIsCreatingTeam(true);
      setError(null);

      try {
        const response = await createTeam(name, description, managerId);

        if (response.success && response.data) {
          // Refresh teams to get the new team with member count
          const teamsResponse = await getAdminTeams();
          if (teamsResponse.success && teamsResponse.data) {
            setTeams(teamsResponse.data.teams);
          }
        } else {
          throw new Error(response.error || 'Failed to create team');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create team');
      } finally {
        setIsCreatingTeam(false);
      }
    },
    []
  );

  // Handle team update
  const handleUpdateTeamDetails = useCallback(
    async (teamId: string, updates: { name?: string; description?: string; manager_id?: string | null }) => {
      setIsUpdatingTeam(true);
      setError(null);

      try {
        const response = await updateTeam(teamId, updates);

        if (response.success && response.data) {
          // Update the team in the local state
          setTeams(prevTeams =>
            prevTeams.map(team =>
              team.id === teamId
                ? { ...response.data!.team, member_count: team.member_count }
                : team
            )
          );
        } else {
          throw new Error(response.error || 'Failed to update team');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update team');
      } finally {
        setIsUpdatingTeam(false);
      }
    },
    []
  );

  // Handle team deletion
  const handleDeleteTeam = useCallback(
    async (teamId: string) => {
      setIsDeletingTeam(true);
      setError(null);

      try {
        const response = await deleteTeam(teamId);

        if (response.success) {
          // Remove the team from local state
          setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));

          // Refresh users and agents to update their team assignments
          const [usersResponse, agentsResponse] = await Promise.all([
            getAdminUsers(),
            getAdminAgents(),
          ]);
          if (usersResponse.success && usersResponse.data) {
            setUsers(usersResponse.data.users);
          }
          if (agentsResponse.success && agentsResponse.data) {
            setAgents(agentsResponse.data.agents);
          }
        } else {
          throw new Error(response.error || 'Failed to delete team');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete team');
      } finally {
        setIsDeletingTeam(false);
      }
    },
    []
  );

  // Handle agent team assignment (for sales agents from agents table)
  const handleUpdateAgentTeam = useCallback(
    async (agentUserId: string, teamId: string | null) => {
      setIsUpdatingTeam(true);
      setError(null);

      try {
        const response = await updateAgentTeam(agentUserId, teamId);

        if (response.success && response.data) {
          // Update the agent in local state
          setAgents(prevAgents =>
            prevAgents.map(agent =>
              agent.agent_user_id === agentUserId ? response.data!.agent : agent
            )
          );

          // Refresh teams to update member counts
          const teamsResponse = await getAdminTeams();
          if (teamsResponse.success && teamsResponse.data) {
            setTeams(teamsResponse.data.teams);
          }
        } else {
          throw new Error(response.error || 'Failed to update agent team');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update agent team');
      } finally {
        setIsUpdatingTeam(false);
      }
    },
    []
  );

  // Get managers for team assignment
  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-medium">Back to Chat</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h1 className="text-lg font-semibold text-slate-900">
                  Admin Panel
                </h1>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-lg font-semibold text-slate-900">
                  {users.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Teams</p>
                <p className="text-lg font-semibold text-slate-900">
                  {teams.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8">
            {(
              [
                { id: 'users', label: 'Users', count: users.length },
                { id: 'teams', label: 'Teams', count: teams.length },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-slate-200">
          {activeTab === 'users' && (
            <UserTable
              users={users}
              teams={teams}
              onUpdateRole={handleUpdateRole}
              onUpdateTeam={handleUpdateTeam}
              isUpdating={isUpdatingUser}
            />
          )}
          {activeTab === 'teams' && (
            <TeamList
              teams={teams}
              users={users}
              agents={agents}
              managers={managers}
              onCreateTeam={handleCreateTeam}
              onUpdateTeam={handleUpdateTeamDetails}
              onUpdateAgentTeam={handleUpdateAgentTeam}
              onDeleteTeam={handleDeleteTeam}
              isCreating={isCreatingTeam}
              isUpdating={isUpdatingTeam}
              isDeleting={isDeletingTeam}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
