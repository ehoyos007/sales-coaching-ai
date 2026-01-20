import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import chatRoutes from './chat.routes.js';
import agentsRoutes from './agents.routes.js';
import callsRoutes from './calls.routes.js';
import teamRoutes from './team.routes.js';
import searchRoutes from './search.routes.js';
import rubricRoutes from './rubric.routes.js';

const router = Router();

// Mount all routes under /api/v1
// Public routes (no auth required)
router.use('/auth', authRoutes);

// Admin routes (admin only)
router.use('/admin', adminRoutes);

// Protected routes
router.use('/chat', chatRoutes);
router.use('/agents', agentsRoutes);
router.use('/calls', callsRoutes);
router.use('/team', teamRoutes);
router.use('/search', searchRoutes);
router.use('/rubric', rubricRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0-auth',
    buildTime: '2026-01-20T22:00:00Z',
  });
});

export default router;
