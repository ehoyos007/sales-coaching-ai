import { Router } from 'express';
import chatRoutes from './chat.routes.js';
import agentsRoutes from './agents.routes.js';
import callsRoutes from './calls.routes.js';
import teamRoutes from './team.routes.js';
import searchRoutes from './search.routes.js';

const router = Router();

// Mount all routes under /api/v1
router.use('/chat', chatRoutes);
router.use('/agents', agentsRoutes);
router.use('/calls', callsRoutes);
router.use('/team', teamRoutes);
router.use('/search', searchRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
