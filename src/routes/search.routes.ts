import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { authenticate, scopeDataAccess } from '../middleware/auth.middleware.js';

const router = Router();

// All search routes require authentication and data scoping
router.use(authenticate);
router.use(scopeDataAccess);

// POST /api/v1/search - Search calls (scoped by user role)
router.post('/', searchController.searchCalls);

export default router;
