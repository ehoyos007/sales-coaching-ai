/**
 * Configuration for Vercel serverless functions
 * All environment variables are loaded directly from process.env
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Parse CORS origins (supports comma-separated list)
const parsedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/$/, ''));

export const config = {
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  anthropic: {
    apiKey: requireEnv('ANTHROPIC_API_KEY'),
    model: 'claude-sonnet-4-20250514',
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    embeddingModel: 'text-embedding-3-small',
  },
  cors: {
    allowedOrigins: parsedOrigins,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    enabled: !!process.env.SENTRY_DSN,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

export type Config = typeof config;

export default config;
