import { Router } from 'express';
import { agentsController } from '../controllers/agents.controller.js';

const router = Router();

// GET /api/v1/agents - List all agents
router.get('/', agentsController.listAgents);

// GET /api/v1/agents/:agentId - Get specific agent
router.get('/:agentId', agentsController.getAgent);

// GET /api/v1/agents/:agentId/calls - Get agent's calls
router.get('/:agentId/calls', agentsController.getAgentCalls);

// GET /api/v1/agents/:agentId/performance - Get agent performance stats
router.get('/:agentId/performance', agentsController.getAgentPerformance);

export default router;
