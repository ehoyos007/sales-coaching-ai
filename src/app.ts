import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logging.middleware.js';

export function createApp(): Express {
  const app = express();

  // CORS middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check exact match
      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check wildcard patterns (e.g., *.vercel.app)
      const isAllowed = config.cors.allowedOrigins.some(allowed => {
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return origin.endsWith(domain);
        }
        return false;
      });

      if (isAllowed) return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
