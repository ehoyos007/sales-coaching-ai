/**
 * Health Check Endpoint
 * GET /api/v1/health
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../lib/api-handler';

export default createApiHandler({
  GET: async (_req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0-vercel',
      buildTime: new Date().toISOString(),
      runtime: 'vercel-serverless',
    });
  },
});
