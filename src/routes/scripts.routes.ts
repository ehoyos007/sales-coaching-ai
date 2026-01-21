/**
 * Scripts Routes
 * API endpoints for sales scripts management
 */

import { Router } from 'express';
import { scriptsController } from '../controllers/scripts.controller.js';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All scripts routes require authentication
router.use(authenticate);

// ============================================================================
// Script CRUD Operations
// ============================================================================

// GET /api/v1/scripts - Get all scripts grouped by product type (admin, manager)
router.get('/', requireManagerOrAdmin, scriptsController.getAllScripts);

// GET /api/v1/scripts/:id - Get script by ID (admin, manager)
router.get('/:id', requireManagerOrAdmin, scriptsController.getScriptById);

// POST /api/v1/scripts - Upload new script (admin only)
router.post(
  '/',
  requireAdmin,
  scriptsController.uploadMiddleware,
  scriptsController.uploadScript
);

// PUT /api/v1/scripts/:id - Update script metadata (admin only)
router.put('/:id', requireAdmin, scriptsController.updateScript);

// DELETE /api/v1/scripts/:id - Delete script (admin only)
router.delete('/:id', requireAdmin, scriptsController.deleteScript);

// POST /api/v1/scripts/:id/activate - Set script as active for its product type (admin only)
router.post('/:id/activate', requireAdmin, scriptsController.activateScript);

// ============================================================================
// Sync Operations
// ============================================================================

// POST /api/v1/scripts/:id/sync - Start sync analysis (admin only)
router.post('/:id/sync', requireAdmin, scriptsController.startSync);

// GET /api/v1/scripts/sync/:logId - Get sync status/results (admin, manager)
router.get('/sync/:logId', requireManagerOrAdmin, scriptsController.getSyncStatus);

// POST /api/v1/scripts/sync/:logId/apply - Apply approved changes (admin only)
router.post('/sync/:logId/apply', requireAdmin, scriptsController.applySyncChanges);

// POST /api/v1/scripts/sync/:logId/reject - Reject sync (admin only)
router.post('/sync/:logId/reject', requireAdmin, scriptsController.rejectSync);

export default router;
