import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured with a Clerk JWT for authorization.
 * @param clerkToken - The Clerk authentication token (JWT) to use for Authorization header
 * @returns Supabase client instance with global headers set to include the Clerk token
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
  // Use environment variables for Supabase credentials
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://grtuwjxwutwqfdbpehfc.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and ANON_KEY must be set in environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};