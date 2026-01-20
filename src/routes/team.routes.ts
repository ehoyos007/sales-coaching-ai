import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';

const router = Router();

// GET /api/v1/team/summary - Get team summary
router.get('/summary', teamController.getTeamSummary);

export default router;
