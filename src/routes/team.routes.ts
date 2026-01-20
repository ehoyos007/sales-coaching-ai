import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { authenticate, scopeDataAccess, requireManagerOrAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All team routes require authentication, data scoping, and manager/admin role
router.use(authenticate);
router.use(scopeDataAccess);
router.use(requireManagerOrAdmin);

// GET /api/v1/team/summary - Get team summary (managers see team, admin sees all)
router.get('/summary', teamController.getTeamSummary);

export default router;
