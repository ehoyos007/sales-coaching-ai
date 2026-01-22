/**
 * Supabase database client for Vercel serverless functions
 * Uses service role key to bypass RLS for backend operations
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client (singleton for serverless warm instances)
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseClient;
}

/**
 * Create a new Supabase client (for cases where you need a fresh instance)
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export { supabaseClient };
