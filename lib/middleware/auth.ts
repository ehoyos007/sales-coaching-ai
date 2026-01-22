/**
 * Authentication middleware for Vercel serverless functions
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  authService,
  UserProfile,
  UserRole,
  DataAccessScope,
} from '../services/auth.service';
import { ApiException } from '../api-handler';

// =============================================
// EXTEND REQUEST TYPE
// =============================================

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
  };
  profile?: UserProfile;
  dataScope?: DataAccessScope;
}

// =============================================
// AUTHENTICATION
// =============================================

/**
 * Verifies JWT token and returns user/profile
 * Use with withAuth wrapper
 */
export async function authenticate(
  req: VercelRequest
): Promise<{ user: { id: string; email: string }; profile: UserProfile }> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiException.unauthorized(
      'Authentication required. Please provide a valid access token.'
    );
  }

  const token = authHeader.split(' ')[1];
  const result = await authService.verifyToken(token);

  if (!result) {
    throw ApiException.unauthorized(
      'Invalid or expired token. Please sign in again.'
    );
  }

  return {
    user: {
      id: result.user.id,
      email: result.user.email!,
    },
    profile: result.profile,
  };
}

// =============================================
// AUTHORIZATION
// =============================================

/**
 * Requires specific roles to access route
 */
export function requireRole(profile: UserProfile, ...allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(profile.role)) {
    throw ApiException.forbidden(
      `Insufficient permissions. Requires: ${allowedRoles.join(' or ')}`
    );
  }
}

export function requireAdmin(profile: UserProfile): void {
  requireRole(profile, 'admin');
}

export function requireManagerOrAdmin(profile: UserProfile): void {
  requireRole(profile, 'admin', 'manager');
}

// =============================================
// DATA SCOPING
// =============================================

/**
 * Get data access scope for the user
 */
export async function getDataScope(
  profile: UserProfile,
  req: VercelRequest
): Promise<DataAccessScope> {
  // Check if query requests floor-wide data
  const body = req.body as Record<string, unknown> | undefined;
  const query = req.query as Record<string, string | string[] | undefined>;

  const queryText =
    (body?.message as string) ||
    (body?.query as string) ||
    (query?.q as string) ||
    '';

  const isFloorWide = authService.detectFloorWideIntent(queryText);

  return authService.getDataAccessScope(profile, isFloorWide);
}

/**
 * Checks if user can access data for a specific agent_user_id
 */
export function canAccessAgent(
  profile: UserProfile,
  dataScope: DataAccessScope,
  targetAgentId: string | null | undefined
): void {
  if (!targetAgentId) {
    return; // No specific agent requested
  }

  // Admins can access any agent
  if (profile.role === 'admin') {
    return;
  }

  // Check if target is in accessible agents
  if (!dataScope.agentUserIds.includes(targetAgentId)) {
    throw ApiException.forbidden(
      profile.role === 'agent'
        ? 'You can only access your own data'
        : 'Agent is not in your team. Use floor-wide query to access all agents.'
    );
  }
}

// =============================================
// HANDLER WRAPPERS
// =============================================

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<void> | void;

/**
 * Wraps a handler with authentication
 */
export function withAuth(handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (req, res) => {
    const auth = await authenticate(req);
    req.user = auth.user;
    req.profile = auth.profile;
    return handler(req, res);
  };
}

/**
 * Wraps a handler with authentication and data scoping
 */
export function withAuthAndScope(handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (req, res) => {
    const auth = await authenticate(req);
    req.user = auth.user;
    req.profile = auth.profile;
    req.dataScope = await getDataScope(auth.profile, req);
    return handler(req, res);
  };
}

/**
 * Wraps a handler with authentication and role check
 */
export function withRole(
  ...roles: UserRole[]
): (handler: AuthenticatedHandler) => AuthenticatedHandler {
  return (handler: AuthenticatedHandler) => {
    return async (req, res) => {
      const auth = await authenticate(req);
      req.user = auth.user;
      req.profile = auth.profile;
      requireRole(auth.profile, ...roles);
      return handler(req, res);
    };
  };
}

// =============================================
// HELPERS
// =============================================

/**
 * Returns scope description for response messages
 */
export function getScopeDescription(scope: DataAccessScope): string {
  if (scope.isFloorWide) {
    return 'floor-wide (all agents)';
  }
  if (scope.isTeamScope && scope.teamName) {
    return `${scope.teamName} team`;
  }
  if (scope.agentUserIds.length === 1) {
    return 'your calls';
  }
  return 'accessible agents';
}

/**
 * Builds a Supabase filter for agent_user_id based on data scope
 */
export function buildAgentFilter(scope: DataAccessScope): {
  column: string;
  operator: 'in' | 'eq';
  value: string | string[];
} | null {
  if (scope.agentUserIds.length === 0) {
    return null;
  }

  if (scope.agentUserIds.length === 1) {
    return {
      column: 'agent_user_id',
      operator: 'eq',
      value: scope.agentUserIds[0],
    };
  }

  return {
    column: 'agent_user_id',
    operator: 'in',
    value: scope.agentUserIds,
  };
}
