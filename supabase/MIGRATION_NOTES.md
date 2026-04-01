# Supabase Auth → Clerk Migration Notes

## What Was Cleaned Up

### Deleted SQL Files
These files were reference/migration files that are no longer needed:
- `supabase-schema.sql` - Old schema definition
- `supabase-fix.sql` - Old fix script
- `supabase/reviews.sql` - Reviews table setup
- `supabase/update_ratings.sql` - Rating update triggers
- `supabase/notify_review.sql` - Review notification triggers
- `supabase/create_shipments_table.sql` - Shipments table setup
- `supabase/fix_relationships.sql` - Relationship fixes

### Database Cleanup Required
Run `supabase/cleanup-old-auth.sql` in your Supabase SQL Editor to remove:
- `on_auth_user_created` trigger on `auth.users`
- `handle_new_user()` function
- Any other old auth-related triggers/functions

## Current Architecture

### Authentication: Clerk
- User sign-up/sign-in handled by Clerk
- Clerk JWT tokens used for Supabase authorization
- Role selection happens in `/choose-role` page

### Database: Supabase
- All data tables remain in Supabase
- Row Level Security (RLS) policies use Clerk user IDs
- Supabase client configured with `persistSession: false` (no Supabase auth)

### How It Works
1. User signs up/signs in via Clerk
2. Clerk provides JWT token
3. Frontend exchanges Clerk token for Supabase token via Clerk's Supabase template
4. Supabase client uses this token for authenticated requests
5. RLS policies validate the Clerk user ID in the JWT

## Key Files
- `src/utils/supabaseClient.ts` - Creates Clerk-authenticated Supabase client
- `src/hooks/useSupabase.ts` - Hook for getting authenticated client
- `src/contexts/AuthContext.tsx` - Clerk auth context wrapper
- `src/pages/ChooseRole.tsx` - Role selection & user profile creation
- `src/integrations/supabase/client.ts` - Anonymous Supabase client (for public data)

## Important Notes
- The `public.users` table is now populated via the ChooseRole page, not auth triggers
- All RLS policies should reference `auth.jwt() ->> 'sub'` for user ID validation
- No Supabase auth tables are used - Clerk handles all authentication