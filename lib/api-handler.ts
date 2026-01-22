/**
 * API handler wrapper for Vercel serverless functions
 * Handles CORS, errors, and method validation
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './cors';
import * as Sentry from '@sentry/node';

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse
) => Promise<void> | void;

export interface ApiHandlerConfig {
  methods: HttpMethod[];
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

/**
 * Wraps an API handler with CORS, error handling, and method validation
 */
export function createApiHandler(
  handlers: Partial<Record<HttpMethod, ApiHandler>>,
  config?: Partial<ApiHandlerConfig>
): ApiHandler {
  const allowedMethods = config?.methods || (Object.keys(handlers) as HttpMethod[]);

  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      // Handle CORS
      if (setCorsHeaders(req, res)) {
        return; // OPTIONS request handled
      }

      const method = req.method as HttpMethod;

      // Method validation
      if (!allowedMethods.includes(method)) {
        res.setHeader('Allow', allowedMethods.join(', '));
        res.status(405).json({
          error: 'Method Not Allowed',
          message: `Method ${method} is not allowed. Use: ${allowedMethods.join(', ')}`,
        });
        return;
      }

      // Get handler for method
      const handler = handlers[method];
      if (!handler) {
        res.status(405).json({
          error: 'Method Not Allowed',
          message: `No handler for method ${method}`,
        });
        return;
      }

      // Execute handler
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      // Capture to Sentry
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
      }

      // Handle known error types
      if (error instanceof ApiException) {
        res.status(error.statusCode).json({
          error: error.name,
          message: error.message,
          details: error.details,
        });
        return;
      }

      // Unknown error
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Internal Server Error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : message,
      });
    }
  };
}

/**
 * Custom API exception for controlled error responses
 */
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
  }

  static badRequest(message: string, details?: unknown): ApiException {
    return new ApiException(400, message, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiException {
    return new ApiException(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiException {
    return new ApiException(403, message);
  }

  static notFound(message = 'Not found'): ApiException {
    return new ApiException(404, message);
  }

  static internal(message = 'Internal server error'): ApiException {
    return new ApiException(500, message);
  }
}

/**
 * Helper to send success response
 */
export function sendSuccess<T>(res: VercelResponse, data: T, statusCode = 200): void {
  res.status(statusCode).json(data);
}

/**
 * Helper to send error response
 */
export function sendError(
  res: VercelResponse,
  statusCode: number,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({
    error: getErrorName(statusCode),
    message,
    details,
  });
}

function getErrorName(statusCode: number): string {
  const names: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };
  return names[statusCode] || 'Error';
}
