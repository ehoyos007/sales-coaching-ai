import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Color code based on status
    if (res.statusCode >= 500) {
      console.error('🔴', JSON.stringify(log));
    } else if (res.statusCode >= 400) {
      console.warn('🟡', JSON.stringify(log));
    } else {
      console.log('🟢', JSON.stringify(log));
    }
  });

  next();
}
