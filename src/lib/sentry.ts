import * as Sentry from '@sentry/node';
import { config } from '../config/index.js';

export function initSentry(): void {
  if (!config.sentry.enabled) {
    console.log('Sentry: Disabled (no SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.server.nodeEnv,

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

    // Add release version for source maps
    release: process.env.npm_package_version || '1.0.0',
  });

  console.log('Sentry: Initialized');
}

export { Sentry };
