import * as Sentry from '@sentry/node';
import { config } from '../config/index.js';

export function initSentry(): void {
  if (!config.sentry.enabled) {
    console.log('Sentry: Disabled (no SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: process.env.VERCEL_ENV || config.server.nodeEnv,

    // Add branch info for filtering errors by deployment
    initialScope: {
      tags: {
        branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      },
    },

    // Performance monitoring
    tracesSampleRate: config.server.nodeEnv === 'production' ? 0.1 : 1.0,

    // Only send errors in production by default
    beforeSend(event) {
      // Filter out expected errors
      if (event.exception?.values?.[0]?.value?.includes('Route not found')) {
        return null;
      }
      return event;
    },

    // Release version includes commit SHA for source maps
    release: `sales-coaching-ai@${process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || 'dev'}`,
  });

  console.log('Sentry: Initialized');
}

export { Sentry };
