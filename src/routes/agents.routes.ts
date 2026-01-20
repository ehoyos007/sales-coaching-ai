import { Router } from 'express';
import { agentsController } from '../controllers/agents.controller.js';
import { authenticate, scopeDataAccess, canAccessAgent } from '../middleware/auth.middleware.js';

const router = Router();

// All agent routes require authentication and data scoping
router.use(authenticate);
router.use(scopeDataAccess);

// GET /api/v1/agents - List all agents (scoped by role)
router.get('/', agentsController.listAgents);

// GET /api/v1/agents/:agentId - Get specific agent (with access check)
router.get('/:agentId', canAccessAgent, agentsController.getAgent);

// GET /api/v1/agents/:agentId/calls - Get agent's calls (with access check)
router.get('/:agentId/calls', canAccessAgent, agentsController.getAgentCalls);

// GET /api/v1/agents/:agentId/performance - Get agent performance stats (with access check)
router.get('/:agentId/performance', canAccessAgent, agentsController.getAgentPerformance);

export default router;
