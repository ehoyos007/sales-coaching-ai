import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = Router();

// POST /api/v1/search - Search calls
router.post('/', searchController.searchCalls);

export default router;
