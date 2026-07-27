import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Supabase Environment] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[Supabase Environment] AnonKey (Prefix):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
});

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

/**
 * Centralized helper for safe Supabase queries.
 * Logs warnings instead of throwing errors or unhandled promise rejections.
 * Returns the fallback value on 400, 404, or network errors.
 */
export async function safeSupabaseQuery<T>(
  queryPromiseFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await queryPromiseFn();
    if (error) {
      console.warn('[Safe Supabase Query Warning]:', error.message || error);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.warn('[Safe Supabase Query Exception]:', err instanceof Error ? err.message : err);
    return fallback;
  }
}
