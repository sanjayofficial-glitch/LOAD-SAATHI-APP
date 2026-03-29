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
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow truckers to view pending shipments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shipments' AND policyname = 'Truckers can view pending shipments'
  ) THEN
    CREATE POLICY "Truckers can view pending shipments" ON public.shipments
    FOR SELECT TO authenticated USING (status = 'pending');
  END IF;
END $$;

-- Policy: Allow authenticated users to view basic profile info (needed for joins)
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

-- Policy: Allow truckers to manage their own shipment requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shipment_requests' AND policyname = 'Truckers can manage own requests'
  ) THEN
    CREATE POLICY "Truckers can manage own requests" ON public.shipment_requests
    FOR ALL TO authenticated USING (auth.uid() = trucker_id) WITH CHECK (auth.uid() = trucker_id);
  END IF;
END $$;