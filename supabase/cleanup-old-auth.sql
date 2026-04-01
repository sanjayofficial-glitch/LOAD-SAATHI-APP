-- ============================================
-- CLEANUP SCRIPT: Remove Old Supabase Auth Triggers & Functions
-- Run this in your Supabase SQL Editor
-- ============================================
-- This script removes the old auth.user triggers and functions
-- that were used when Supabase handled authentication.
-- Since you've migrated to Clerk, these are no longer needed.
-- ============================================

-- 1. Drop the trigger that auto-creates user profiles on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function that was handling new user creation
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Drop any other auth-related triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- 4. Drop any remaining auth-related functions
DROP FUNCTION IF EXISTS public.handle_updated_user();
DROP FUNCTION IF EXISTS public.handle_deleted_user();

-- ============================================
-- VERIFICATION QUERIES (Optional - run these to confirm cleanup)
-- ============================================

-- Check that the trigger is gone:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check that the function is gone:
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- ============================================
-- NOTE: Your public.users table and all other tables remain intact.
-- Clerk will now handle user creation via the ChooseRole page.
-- ============================================