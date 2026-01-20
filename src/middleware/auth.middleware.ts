// =============================================
// AUTH MIDDLEWARE - Sales Coaching AI
// With Team-Based Data Scoping
// =============================================

import { Request, Response, NextFunction } from 'express';
import { authService, UserProfile, UserRole, DataAccessScope } from '../services/auth/auth.service.js';

// =============================================
// EXTEND EXPRESS REQUEST
// =============================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      profile?: UserProfile;
      dataScope?: DataAccessScope;
    }
  }
}

// =============================================
// AUTHENTICATION MIDDLEWARE
// =============================================

/**
 * Verifies JWT token and attaches user/profile to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid access token',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.verifyToken(token);

    if (!result) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Session expired. Please sign in again.',
      });
      return;
    }

    req.user = {
      id: result.user.id,
      email: result.user.email!,
    };
    req.profile = result.profile;

    next();
  } catch (error) {
    console.error('[auth.middleware] Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

// =============================================
// AUTHORIZATION MIDDLEWARE
// =============================================

/**
 * Requires specific roles to access route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.profile) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.profile.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Requires: ${allowedRoles.join(' or ')}`,
        yourRole: req.profile.role,
      });
      return;
    }

    next();
  };
};

// Convenience exports
export const requireAdmin = requireRole('admin');
export const requireManagerOrAdmin = requireRole('admin', 'manager');
export const requireAuth = authenticate;

// =============================================
// DATA SCOPING MIDDLEWARE
// =============================================

/**
 * Determines data access scope based on user role and query intent.
 *
 * For managers, checks if query contains floor-wide keywords.
 * Attaches `dataScope` to request with list of accessible agent_user_ids.
 *
 * Usage: Apply after authenticate middleware
 */
export const scopeDataAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.profile) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    // Check if query requests floor-wide data
    // Look in body.message, body.query, or query.q
    const queryText =
      req.body?.message ||
      req.body?.query ||
      (req.query?.q as string) ||
      '';

    const isFloorWide = authService.detectFloorWideIntent(queryText);

    // Get data access scope
    req.dataScope = await authService.getDataAccessScope(req.profile, isFloorWide);

    console.log(`[auth.middleware] Data scope for ${req.profile.email}: ${getScopeDescription(req.dataScope)} (${req.dataScope.agentUserIds.length} agents)`);

    next();
  } catch (error) {
    console.error('[auth.middleware] Data scoping error:', error);
    res.status(500).json({ success: false, error: 'Failed to determine data access scope' });
  }
};

/**
 * Forces floor-wide scope (for specific routes that always need all data)
 */
export const forceFloorWideScope = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.profile) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Only admin and manager can access floor-wide
  if (!authService.isManagerOrAdmin(req.profile)) {
    res.status(403).json({
      success: false,
      error: 'Floor-wide access denied',
      message: 'Only managers and admin can view floor-wide data',
    });
    return;
  }

  req.dataScope = await authService.getDataAccessScope(req.profile, true);
  next();
};

// =============================================
// AGENT ACCESS CHECK
// =============================================

/**
 * Checks if user can access data for a specific agent_user_id.
 *
 * - Agents: Only their own
 * - Managers: Their team (or anyone if floor-wide requested)
 * - Admin: Anyone
 */
export const canAccessAgent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.profile || !req.dataScope) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const targetAgentId =
    req.params.agentId ||
    req.params.agentUserId ||
    (req.query.agent_user_id as string) ||
    req.body?.agent_user_id;

  if (!targetAgentId) {
    // No specific agent requested, proceed
    next();
    return;
  }

  // Admins can access any agent
  if (req.profile.role === 'admin') {
    next();
    return;
  }

  // Check if target is in accessible agents
  if (!req.dataScope.agentUserIds.includes(targetAgentId)) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      message:
        req.profile.role === 'agent'
          ? 'You can only access your own data'
          : 'Agent is not in your team. Use floor-wide query to access all agents.',
    });
    return;
  }

  next();
};

// =============================================
// QUERY FILTER HELPER
// =============================================

/**
 * Builds a Supabase filter for agent_user_id based on data scope.
 *
 * Usage in handlers:
 * ```
 * const query = supabase.from('call_metadata').select('*');
 * applyAgentFilter(query, req.dataScope);
 * ```
 */
export function buildAgentFilter(scope: DataAccessScope): {
  column: string;
  operator: 'in' | 'eq';
  value: string | string[];
} | null {
  if (scope.agentUserIds.length === 0) {
    return null; // No access
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
