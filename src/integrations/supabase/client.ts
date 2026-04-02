import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://grtuwjxwutwqfdbpehfc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that credentials are set
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Supabase credentials not set in environment variables. Using fallback values.');
}

// This client is for anonymous/public access only
// For authenticated requests, use createClerkSupabaseClient from @/utils/supabaseClient
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});