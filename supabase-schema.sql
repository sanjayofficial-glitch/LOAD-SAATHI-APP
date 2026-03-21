-- Ensure RLS is enabled on core tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing select policies to prevent conflicts
DROP POLICY IF EXISTS "Trips are viewable by everyone" ON public.trips;
DROP POLICY IF EXISTS "Allow public read" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create robust SELECT policies for authenticated users
-- This ensures any logged-in user (shipper or trucker) can see trips and user profiles
CREATE POLICY "trips_read_policy" ON public.trips
FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_read_policy" ON public.users
FOR SELECT TO authenticated USING (true);

-- Ensure truckers can still manage their own trips
DROP POLICY IF EXISTS "Truckers can insert own trips" ON public.trips;
CREATE POLICY "trips_insert_policy" ON public.trips
FOR INSERT TO authenticated WITH CHECK (auth.uid() = trucker_id);

DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "trips_update_policy" ON public.trips
FOR UPDATE TO authenticated USING (auth.uid() = trucker_id);