import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../lib/sentry.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Capture 5xx errors to Sentry
  if (statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag('status_code', statusCode.toString());
      scope.setExtra('url', req.url);
      scope.setExtra('method', req.method);
      scope.setExtra('body', req.body);

      // Add user context if available
      if (req.user) {
        scope.setUser({
          id: req.user.id,
          email: req.user.email,
        });
      }

      Sentry.captureException(err);
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

/**
 * Create a custom API error
 */
export function createError(message: string, statusCode: number = 500): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
