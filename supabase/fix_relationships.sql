-- Ensure foreign key relationship between shipments and users exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipments_shipper'
  ) THEN
    ALTER TABLE public.shipments
    ADD CONSTRAINT fk_shipments_shipper
    FOREIGN KEY (shipper_id) REFERENCES public.users(id)
    ON DELETE CASCADE;
  END IF;

  -- Ensure shipment_requests has the correct relationships
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipment_requests_trucker'
  ) THEN
    ALTER TABLE public.shipment_requests
    ADD CONSTRAINT fk_shipment_requests_trucker
    FOREIGN KEY (trucker_id) REFERENCES public.users(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipment_requests_shipment'
  ) THEN
    ALTER TABLE public.shipment_requests
    ADD CONSTRAINT fk_shipment_requests_shipment
    FOREIGN KEY (shipment_id) REFERENCES public.shipments(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add SELECT policy for users table so authenticated users can see basic profile info
-- This is required for joins like shipper:users(*) to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Allow authenticated users to view profiles'
  ) THEN
    CREATE POLICY "Allow authenticated users to view profiles" ON public.users
    FOR SELECT TO authenticated USING (true);
  END IF;
END $$;