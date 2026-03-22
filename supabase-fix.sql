-- 1. Drop the restrictive request creation policy
DROP POLICY IF EXISTS "Shippers can create requests" ON public.requests;

-- 2. Create a simpler policy that just verifies your identity
CREATE POLICY "Users can create their own requests" ON public.requests
FOR INSERT TO authenticated 
WITH CHECK (shipper_id = auth.uid());

-- 3. Make address columns optional since they aren't in the UI yet
-- This prevents "null value" errors that can sometimes trigger RLS failures
ALTER TABLE public.requests ALTER COLUMN pickup_address DROP NOT NULL;
ALTER TABLE public.requests ALTER COLUMN delivery_address DROP NOT NULL;

-- 4. Ensure shipper_id is automatically set to the logged-in user
ALTER TABLE public.requests ALTER COLUMN shipper_id SET DEFAULT auth.uid();

-- 5. Fix the read policy for requests to ensure users can see their own data
DROP POLICY IF EXISTS "Public read access for requests" ON public.requests;
CREATE POLICY "Users can see relevant requests" ON public.requests
FOR SELECT TO authenticated USING (
  shipper_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = requests.trip_id AND trips.trucker_id = auth.uid()
  )
);