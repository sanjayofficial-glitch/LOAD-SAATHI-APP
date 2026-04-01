import { getToken } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';

export const getSupabase = async () => {
  const token = await getToken({ template: 'supabase' });
  if (!token) {
    throw new Error('Unable to retrieve Supabase token from Clerk');
  }
  return createClerkSupabaseClient(token);
};