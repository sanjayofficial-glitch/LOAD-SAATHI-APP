import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured with a Clerk JWT for authorization.
 * @param clerkToken - The Clerk authentication token to use for Authorization header
 * @returns Supabase client instance with global headers set to include the Clerk token
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    }
  );
};