import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry: Disabled (no VITE_SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Filter out common non-actionable errors
    beforeSend(event) {
      // Ignore network errors that are user-facing
      if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
        return null;
      }
      return event;
    },
  });

  console.log('Sentry: Initialized');
}

// Re-export Sentry for use elsewhere
export { Sentry };

// Helper to set user context
export function setSentryUser(user: { id: string; email: string; role?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

// Helper to clear user context on logout
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

// Helper to capture errors with context
export function captureError(error: Error, context?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}
