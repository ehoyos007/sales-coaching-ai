/**
 * CORS handler for Vercel serverless functions
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  '*.vercel.app',
];

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl)

  // Check exact match
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Check wildcard patterns (e.g., *.vercel.app)
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
