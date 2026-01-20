import { Router } from 'express';
import { callsController } from '../controllers/calls.controller.js';

const router = Router();

// GET /api/v1/calls/:callId - Get specific call
router.get('/:callId', callsController.getCall);

// GET /api/v1/calls/:callId/transcript - Get call transcript
router.get('/:callId/transcript', callsController.getCallTranscript);

export default router;
