import { Router } from 'express';
import { rubricController } from '../controllers/rubric.controller.js';

const router = Router();

// GET /api/v1/rubric - Get active rubric configuration
router.get('/', rubricController.getActiveRubric);

// GET /api/v1/rubric/versions - List all rubric versions
router.get('/versions', rubricController.listRubricVersions);

// GET /api/v1/rubric/:id - Get specific rubric by ID
router.get('/:id', rubricController.getRubricById);

// POST /api/v1/rubric - Create new rubric version
router.post('/', rubricController.createRubric);

// PUT /api/v1/rubric/:id - Update draft rubric
router.put('/:id', rubricController.updateRubric);

// POST /api/v1/rubric/:id/activate - Activate a rubric version
router.post('/:id/activate', rubricController.activateRubric);

// DELETE /api/v1/rubric/:id - Delete draft rubric
router.delete('/:id', rubricController.deleteRubric);

export default router;
