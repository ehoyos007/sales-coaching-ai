import { Router } from 'express';
import { callsController } from '../controllers/calls.controller.js';
import { authenticate, scopeDataAccess } from '../middleware/auth.middleware.js';

const router = Router();

// All calls routes require authentication and data scoping
router.use(authenticate);
router.use(scopeDataAccess);

// GET /api/v1/calls/:callId - Get specific call
router.get('/:callId', callsController.getCall);

// GET /api/v1/calls/:callId/transcript - Get call transcript
router.get('/:callId/transcript', callsController.getCallTranscript);

export default router;
