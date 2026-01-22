/**
 * Auth Service for Vercel serverless functions
 * Handles authentication, authorization, and team-based permissions
 */
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { config } from '../config';
import { getSupabaseClient } from '../database';

// =============================================
// TYPES
// =============================================

export type UserRole = 'admin' | 'manager' | 'agent';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  team_id: string | null;
  agent_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface TeamMember {
  team_id: string;
  team_name: string;
  manager_id: string | null;
  manager_email: string | null;
  manager_name: string | null;
  agent_id: string;
  agent_email: string;
  agent_name: string | null;
  agent_user_id: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  profile?: UserProfile;
  error?: string;
}

export interface DataAccessScope {
  agentUserIds: string[];
  isFloorWide: boolean;
  isTeamScope: boolean;
  teamId: string | null;
  teamName: string | null;
}

// =============================================
// CONSTANTS
// =============================================

const ALLOWED_DOMAIN = 'firsthealthenroll.org';
const ADMIN_EMAIL = 'ehoyos@firsthealthenroll.org';

// =============================================
// AUTH SERVICE CLASS
// =============================================

export class AuthService {
  private supabase: SupabaseClient;
  private dbClient: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    this.dbClient = getSupabaseClient();
  }

  // =============================================
  // DOMAIN & EMAIL VALIDATION
  // =============================================

  validateEmailDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === ALLOWED_DOMAIN;
  }

  isAdminEmail(email: string): boolean {
    return email.toLowerCase() === ADMIN_EMAIL;
  }

  // =============================================
  // SIGNUP / SIGNIN
  // =============================================

  async signUp(email: string, password: string, fullName?: string): Promise<AuthResult> {
    if (!this.validateEmailDomain(email)) {
      return {
        success: false,
        error: `Only @${ALLOWED_DOMAIN} email addresses can register.`,
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters.',
      };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user || undefined,
        session: data.session || undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Signup failed',
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const profile = await this.getUserProfile(data.user.id);

      if (profile && !profile.is_active) {
        await this.supabase.auth.signOut();
        return { success: false, error: 'Account deactivated. Contact admin.' };
      }

      await this.updateLastLogin(data.user.id);

      return {
        success: true,
        user: data.user,
        session: data.session,
        profile: profile || undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Sign in failed',
      };
    }
  }

  async verifyToken(token: string): Promise<{ user: User; profile: UserProfile } | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) return null;

      const profile = await this.getUserProfile(user.id);
      if (!profile || !profile.is_active) return null;

      return { user, profile };
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  // =============================================
  // PROFILE MANAGEMENT
  // =============================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.dbClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return error ? null : (data as UserProfile);
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await this.dbClient
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    return error ? null : (data as UserProfile);
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await this.dbClient
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return error ? [] : (data as UserProfile[]);
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'full_name' | 'agent_user_id'>>
  ): Promise<UserProfile | null> {
    const { data, error } = await this.dbClient
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    return error ? null : (data as UserProfile);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await this.dbClient
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  }

  // =============================================
  // ROLE MANAGEMENT
  // =============================================

  async setUserRole(
    callerUserId: string,
    targetUserId: string,
    newRole: 'agent' | 'manager'
  ): Promise<{ success: boolean; error?: string }> {
    const callerProfile = await this.getUserProfile(callerUserId);
    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return { success: false, error: 'Only admin or manager can change roles' };
    }

    const targetProfile = await this.getUserProfile(targetUserId);
    if (targetProfile?.role === 'admin') {
      return { success: false, error: 'Cannot change admin role' };
    }

    const { error } = await this.dbClient
      .from('user_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    return error ? { success: false, error: error.message } : { success: true };
  }

  // =============================================
  // TEAM MANAGEMENT
  // =============================================

  async createTeam(
    callerUserId: string,
    name: string,
    description?: string,
    managerId?: string
  ): Promise<{ success: boolean; team?: Team; error?: string }> {
    const callerProfile = await this.getUserProfile(callerUserId);
    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return { success: false, error: 'Only admin or manager can create teams' };
    }

    if (managerId) {
      const managerProfile = await this.getUserProfile(managerId);
      if (!managerProfile) {
        return { success: false, error: 'Manager user not found' };
      }
      if (managerProfile.role !== 'manager' && managerProfile.role !== 'admin') {
        return { success: false, error: 'Selected user must have manager or admin role' };
      }
    }

    const { data, error } = await this.dbClient
      .from('teams')
      .insert({ name, description, manager_id: managerId || null })
      .select()
      .single();

    return error
      ? { success: false, error: error.message }
      : { success: true, team: data as Team };
  }

  async updateTeam(
    callerUserId: string,
    teamId: string,
    updates: { name?: string; description?: string; manager_id?: string | null }
  ): Promise<{ success: boolean; team?: Team; error?: string }> {
    const callerProfile = await this.getUserProfile(callerUserId);
    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return { success: false, error: 'Only admin or manager can update teams' };
    }

    const { data: existingTeam, error: fetchError } = await this.dbClient
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (fetchError || !existingTeam) {
      return { success: false, error: 'Team not found' };
    }

    if (updates.manager_id !== undefined && updates.manager_id !== null) {
      const managerProfile = await this.getUserProfile(updates.manager_id);
      if (!managerProfile) {
        return { success: false, error: 'Manager user not found' };
      }
      if (managerProfile.role !== 'manager' && managerProfile.role !== 'admin') {
        return { success: false, error: 'Selected user must have manager or admin role' };
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.manager_id !== undefined) updateData.manager_id = updates.manager_id;

    const { data, error } = await this.dbClient
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    return error
      ? { success: false, error: error.message }
      : { success: true, team: data as Team };
  }

  async deleteTeam(
    callerUserId: string,
    teamId: string
  ): Promise<{ success: boolean; error?: string }> {
    const callerProfile = await this.getUserProfile(callerUserId);
    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return { success: false, error: 'Only admin or manager can delete teams' };
    }

    const { data: existingTeam, error: fetchError } = await this.dbClient
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (fetchError || !existingTeam) {
      return { success: false, error: 'Team not found' };
    }

    const { error: unassignError } = await this.dbClient
      .from('user_profiles')
      .update({ team_id: null, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);

    if (unassignError) {
      console.error('[auth.service] Error unassigning team members:', unassignError);
      return { success: false, error: 'Failed to unassign team members' };
    }

    const { error: deleteError } = await this.dbClient
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      console.error('[auth.service] Error deleting team:', deleteError);
      return { success: false, error: 'Failed to delete team' };
    }

    return { success: true };
  }

  async getAllTeams(): Promise<Team[]> {
    const { data: teams, error } = await this.dbClient
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error || !teams) return [];

    const { data: memberCounts } = await this.dbClient
      .from('user_profiles')
      .select('team_id')
      .not('team_id', 'is', null);

    const countMap = new Map<string, number>();
    if (memberCounts) {
      for (const profile of memberCounts) {
        if (profile.team_id) {
          countMap.set(profile.team_id, (countMap.get(profile.team_id) || 0) + 1);
        }
      }
    }

    return teams.map((team) => ({
      ...team,
      member_count: countMap.get(team.id) || 0,
    })) as Team[];
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await this.dbClient
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    return error ? [] : (data as TeamMember[]);
  }

  async assignUserToTeam(
    callerUserId: string,
    targetUserId: string,
    teamId: string | null
  ): Promise<{ success: boolean; error?: string }> {
    const callerProfile = await this.getUserProfile(callerUserId);
    if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
      return { success: false, error: 'Only admin or manager can assign teams' };
    }

    const { error } = await this.dbClient
      .from('user_profiles')
      .update({ team_id: teamId, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    return error ? { success: false, error: error.message } : { success: true };
  }

  // =============================================
  // DATA ACCESS SCOPING
  // =============================================

  async getDataAccessScope(
    profile: UserProfile,
    floorWide: boolean = false
  ): Promise<DataAccessScope> {
    const scope: DataAccessScope = {
      agentUserIds: [],
      isFloorWide: false,
      isTeamScope: false,
      teamId: profile.team_id,
      teamName: null,
    };

    if (profile.team_id) {
      const { data: team } = await this.supabase
        .from('teams')
        .select('name')
        .eq('id', profile.team_id)
        .single();
      scope.teamName = team?.name || null;
    }

    // ADMIN: Always gets all agents
    if (profile.role === 'admin') {
      const { data } = await this.dbClient
        .from('agents')
        .select('agent_user_id')
        .not('agent_user_id', 'is', null);

      scope.agentUserIds = (data || []).map((d) => d.agent_user_id).filter(Boolean);
      scope.isFloorWide = true;
      return scope;
    }

    // MANAGER: Team or floor-wide
    if (profile.role === 'manager') {
      if (floorWide) {
        const { data } = await this.dbClient
          .from('agents')
          .select('agent_user_id')
          .not('agent_user_id', 'is', null);

        scope.agentUserIds = (data || []).map((d) => d.agent_user_id).filter(Boolean);
        scope.isFloorWide = true;
      } else {
        const { data } = await this.dbClient
          .from('agents')
          .select('agent_user_id')
          .eq('team_id', profile.team_id)
          .not('agent_user_id', 'is', null);

        scope.agentUserIds = (data || []).map((d) => d.agent_user_id).filter(Boolean);
        scope.isTeamScope = true;
      }
      return scope;
    }

    // AGENT: Only their own
    if (profile.role === 'agent' && profile.agent_user_id) {
      scope.agentUserIds = [profile.agent_user_id];
      return scope;
    }

    return scope;
  }

  detectFloorWideIntent(query: string): boolean {
    const floorWidePatterns = [
      /floor[\s-]?wide/i,
      /all\s+(agents?|teams?|reps?)/i,
      /entire\s+(floor|company|org)/i,
      /everyone/i,
      /company[\s-]?wide/i,
      /organization[\s-]?wide/i,
      /across\s+all\s+teams?/i,
      /all\s+of\s+(the\s+)?sales/i,
    ];

    return floorWidePatterns.some((pattern) => pattern.test(query));
  }

  // =============================================
  // ROLE CHECK HELPERS
  // =============================================

  isAdmin(profile: UserProfile): boolean {
    return profile.role === 'admin';
  }

  isManager(profile: UserProfile): boolean {
    return profile.role === 'manager';
  }

  isManagerOrAdmin(profile: UserProfile): boolean {
    return ['admin', 'manager'].includes(profile.role);
  }

  hasRole(profile: UserProfile, roles: UserRole[]): boolean {
    return roles.includes(profile.role);
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

export const authService = getAuthService();
