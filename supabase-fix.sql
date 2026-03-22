-- 1. Drop the overly restrictive insert policy
DROP POLICY IF EXISTS "Truckers can create trips" ON public.trips;

-- 2. Create a simpler, more reliable insert policy
-- This ensures you can only post trips for your own ID
CREATE POLICY "Users can create their own trips" ON public.trips
FOR INSERT TO authenticated 
WITH CHECK (trucker_id = auth.uid());

-- 3. Ensure the trucker_id is automatically set if not provided (optional but helpful)
-- This prevents mismatches between the frontend and backend
ALTER TABLE public.trips ALTER COLUMN trucker_id SET DEFAULT auth.uid();

-- 4. Fix the update policy as well to be consistent
DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "Users can update their own trips" ON public.trips
FOR UPDATE TO authenticated 
USING (trucker_id = auth.uid());