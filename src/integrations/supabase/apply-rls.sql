-- Enable RLS on all tables
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    r record;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('shipments', 'requests', 'shipment_requests', 'notifications', 'messages', 'users'))
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = r.tablename)
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
        END LOOP;
    END LOOP;
END $$;

-- Users can only see their own profile
CREATE POLICY "Users can only see own profile" ON public.users
FOR SELECT TO authenticated USING (auth.uid()::uuid = id);

-- Shippers can see all shipments (for browsing)
CREATE POLICY "Shippers can see all shipments" ON public.shipments
FOR SELECT TO authenticated USING (true);

-- Shippers can insert their own shipments
CREATE POLICY "Shippers can insert own shipments" ON public.shipments
FOR INSERT TO authenticated WITH CHECK (auth.uid()::uuid = shipper_id);

-- Shippers can update their own shipments
CREATE POLICY "Shippers can update own shipments" ON public.shipments
FOR UPDATE TO authenticated USING (auth.uid()::uuid = shipper_id);

-- Shippers can delete their own shipments
CREATE POLICY "Shippers can delete own shipments" ON public.shipments
FOR DELETE TO authenticated USING (auth.uid()::uuid = shipper_id);

-- Truckers can see all shipments (for browsing)
CREATE POLICY "Truckers can see all shipments" ON public.shipments
FOR SELECT TO authenticated USING (true);

-- Truckers can see requests for trips they're assigned to
CREATE POLICY "Truckers can see relevant requests" ON public.requests
FOR SELECT TO authenticated USING (
  auth.uid()::uuid = trucker_id OR 
  auth.uid()::uuid IN (
    SELECT trucker_id FROM public.shipment_requests 
    WHERE shipment_id = requests.shipment_id
  )
);

-- Truckers can insert requests for trips
CREATE POLICY "Truckers can insert requests" ON public.requests
FOR INSERT TO authenticated WITH CHECK (auth.uid()::uuid = trucker_id);

-- Truckers can update their own requests
CREATE POLICY "Truckers can update own requests" ON public.requests
FOR UPDATE TO authenticated USING (auth.uid()::uuid = trucker_id);

-- Shippers can see requests for their trips
CREATE POLICY "Shippers can see requests for own trips" ON public.requests
FOR SELECT TO authenticated USING (
  auth.uid()::uuid = shipper_id OR 
  auth.uid()::uuid IN (
    SELECT shipper_id FROM public.shipment_requests 
    WHERE shipment_id = requests.shipment_id
  )
);

-- Truckers can insert shipment requests
CREATE POLICY "Truckers can insert shipment requests" ON public.shipment_requests
FOR INSERT TO authenticated WITH CHECK (auth.uid()::uuid = trucker_id);

-- Shippers can see shipment requests for their shipments
CREATE POLICY "Shippers can see shipment requests" ON public.shipment_requests
FOR SELECT TO authenticated USING (
  auth.uid()::uuid = shipper_id OR 
  auth.uid()::uuid IN (
    SELECT shipper_id FROM public.shipments 
    WHERE id = shipment_requests.shipment_id
  )
);

-- Truckers can update their own shipment requests
CREATE POLICY "Truckers can update own shipment requests" ON public.shipment_requests
FOR UPDATE TO authenticated USING (auth.uid()::uuid = trucker_id);

-- Shippers can delete their own shipment requests
CREATE POLICY "Shippers can delete own shipment requests" ON public.shipment_requests
FOR DELETE TO authenticated USING (auth.uid()::uuid = shipper_id);

-- Users can see their own notifications
CREATE POLICY "Users can see own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid()::uuid = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

-- Users can see their own messages
CREATE POLICY "Users can see own messages" ON public.messages
FOR SELECT TO authenticated USING (
  auth.uid()::uuid = sender_id OR 
  auth.uid()::uuid = recipient_id
);

-- System can insert messages
CREATE POLICY "System can insert messages" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid()::uuid = sender_id OR 
  auth.uid()::uuid = recipient_id
);