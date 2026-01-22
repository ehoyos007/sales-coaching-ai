/**
 * API Root Endpoint
 * GET /api/v1 - API information and available endpoints
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiHandler } from '../../lib/api-handler';

export default createApiHandler({
  GET: async (_req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({
      name: 'Sales Coaching AI API',
      version: '2.0.0-vercel',
      description: 'AI-powered sales coaching chat interface',
      endpoints: {
        auth: {
          signup: 'POST /api/v1/auth/signup',
          signin: 'POST /api/v1/auth/signin',
          signout: 'POST /api/v1/auth/signout',
          me: 'GET /api/v1/auth/me',
          profile: 'PUT /api/v1/auth/profile',
        },
        chat: {
          send: 'POST /api/v1/chat',
          history: 'GET /api/v1/chat/history/:sessionId',
        },
        agents: {
          list: 'GET /api/v1/agents',
          get: 'GET /api/v1/agents/:agentId',
          calls: 'GET /api/v1/agents/:agentId/calls',
          performance: 'GET /api/v1/agents/:agentId/performance',
        },
        calls: {
          get: 'GET /api/v1/calls/:callId',
          transcript: 'GET /api/v1/calls/:callId/transcript',
        },
        team: {
          summary: 'GET /api/v1/team/summary',
        },
        search: {
          query: 'POST /api/v1/search',
        },
        health: 'GET /api/v1/health',
      },
      documentation: 'https://github.com/ehoyos007/sales-coaching-ai',
    });
  },
});
