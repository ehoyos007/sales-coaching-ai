import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Parse CORS origins with logging
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
const parsedOrigins = rawAllowedOrigins.split(',').map(origin => origin.trim());

console.log('[CONFIG] Raw ALLOWED_ORIGINS:', rawAllowedOrigins);
console.log('[CONFIG] Parsed origins:', parsedOrigins);

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
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
    // Support multiple origins via comma-separated list
    allowedOrigins: parsedOrigins,
  },
} as const;

export type Config = typeof config;
