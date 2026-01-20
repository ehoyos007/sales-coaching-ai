import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logging.middleware.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.cors.clientUrl,
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestLogger);

  // API Routes
  app.use('/api/v1', routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'Sales Coaching AI API',
      version: '1.0.0',
      endpoints: {
        chat: 'POST /api/v1/chat',
        agents: 'GET /api/v1/agents',
        calls: 'GET /api/v1/calls/:callId',
        team: 'GET /api/v1/team/summary',
        search: 'POST /api/v1/search',
        health: 'GET /api/v1/health',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
