import { Router } from 'express';
import { rubricController } from '../controllers/rubric.controller.js';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All rubric routes require authentication
router.use(authenticate);

// GET /api/v1/rubric - Get active rubric configuration (all authenticated users)
router.get('/', rubricController.getActiveRubric);

// GET /api/v1/rubric/versions - List all rubric versions (managers/admin only)
router.get('/versions', requireManagerOrAdmin, rubricController.listRubricVersions);

// GET /api/v1/rubric/:id - Get specific rubric by ID (managers/admin only)
router.get('/:id', requireManagerOrAdmin, rubricController.getRubricById);

// POST /api/v1/rubric - Create new rubric version (admin only)
router.post('/', requireAdmin, rubricController.createRubric);

// PUT /api/v1/rubric/:id - Update draft rubric (admin only)
router.put('/:id', requireAdmin, rubricController.updateRubric);

// POST /api/v1/rubric/:id/activate - Activate a rubric version (admin only)
router.post('/:id/activate', requireAdmin, rubricController.activateRubric);

// DELETE /api/v1/rubric/:id - Delete draft rubric (admin only)
router.delete('/:id', requireAdmin, rubricController.deleteRubric);

export default router;
