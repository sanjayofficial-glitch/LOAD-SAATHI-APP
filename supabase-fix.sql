-- 1. Drop all RLS policies to avoid dependency errors
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. Drop ALL foreign key constraints that reference the users table (to avoid type conflicts)
DO $$
DECLARE    r RECORD;
BEGIN
    FOR r IN (SELECT conname, conrelid::regclass AS table_from
              FROM pg_constraint
              WHERE contype = 'f' AND confrelid = 'public.users'::regclass) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_from, r.conname);
    END LOOP;
END $$;

-- 3. Alter all UUID columns that reference users.id to TEXT
ALTER TABLE public.trips ALTER COLUMN trucker_id TYPE TEXT USING trucker_id::TEXT;
ALTER TABLE public.requests ALTER COLUMN shipper_id TYPE TEXT USING shipper_id::TEXT;
ALTER TABLE public.shipments ALTER COLUMN shipper_id TYPE TEXT USING shipper_id::TEXT;
ALTER TABLE public.reviews ALTER COLUMN trucker_id TYPE TEXT USING trucker_id::TEXT;
ALTER TABLE public.reviews ALTER COLUMN shipper_id TYPE TEXT USING shipper_id::TEXT;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
ALTER TABLE public.messages ALTER COLUMN recipient_id TYPE TEXT USING recipient_id::TEXT;
ALTER TABLE public.shipment_requests ALTER COLUMN trucker_id TYPE TEXT USING trucker_id::TEXT;

-- 4. Alter users.id to TEXT (now that no foreign keys reference it)
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 5. Recreate foreign key constraints that reference users.id
ALTER TABLE public.trips ADD CONSTRAINT trips_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id);
ALTER TABLE public.requests ADD CONSTRAINT requests_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id);
ALTER TABLE public.shipments ADD CONSTRAINT shipments_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);
ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id);
ALTER TABLE public.shipment_requests ADD CONSTRAINT shipment_requests_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id);

-- 6. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;

-- 7. Recreate basic RLS policies for users table (users can only see their own data)
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON public.usersFOR DELETE TO authenticated USING (auth.uid() = id);

-- 8. Recreate basic RLS policies for other tables (examples - adjust as needed)
-- Trips: truckers can manage their own trips, public can view active tripsCREATE POLICY "trips_select_policy" ON public.trips
FOR SELECT TO authenticated USING (status = 'active' OR trucker_id = auth.uid());

CREATE POLICY "trips_insert_policy" ON public.trips
FOR INSERT TO authenticated WITH CHECK (trucker_id = auth.uid());

CREATE POLICY "trips_update_policy" ON public.trips
FOR UPDATE TO authenticated USING (trucker_id = auth.uid());

CREATE POLICY "trips_delete_policy" ON public.trips
FOR DELETE TO authenticated USING (trucker_id = auth.uid());

-- Requests: shippers can create requests for their own shipments, truckers can view requests for trips they ownCREATE POLICY "requests_select_policy" ON public.requests
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = requests.trip_id AND (t.trucker_id = auth.uid() OR auth.uid() IN (
      SELECT shipper_id FROM shipments WHERE id IN (
        SELECT shipment_id FROM shipment_requests WHERE trucker_id = auth.uid()
      )
    ))
  )
);

CREATE POLICY "requests_insert_policy" ON public.requests
FOR INSERT TO authenticated WITH CHECK (shipper_id = auth.uid());

CREATE POLICY "requests_update_policy" ON public.requests
FOR UPDATE TO authenticated USING (shipper_id = auth.uid());

CREATE POLICY "requests_delete_policy" ON public.requests
FOR DELETE TO authenticated USING (shipper_id = auth.uid());

-- Shipments: shippers can manage their own shipments
CREATE POLICY "shipments_select_policy" ON public.shipments
FOR SELECT TO authenticated USING (shipper_id = auth.uid());

CREATE POLICY "shipments_insert_policy" ON public.shipments
FOR INSERT TO authenticated WITH CHECK (shipper_id = auth.uid());

CREATE POLICY "shipments_update_policy" ON public.shipments
FOR UPDATE TO authenticated USING (shipper_id = auth.uid());

CREATE POLICY "shipments_delete_policy" ON public.shipments
FOR DELETE TO authenticated USING (shipper_id = auth.uid());

-- Reviews: anyone can read, but only involved parties can write
CREATE POLICY "reviews_select_policy" ON public.reviews
FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert_policy" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = shipper_id OR auth.uid() = trucker_id
);

CREATE POLICY "reviews_update_policy" ON public.reviews
FOR UPDATE TO authenticated USING (
  auth.uid() = shipper_id OR auth.uid() = trucker_id
);

CREATE POLICY "reviews_delete_policy" ON public.reviewsFOR DELETE TO authenticated USING (
  auth.uid() = shipper_id OR auth.uid() = trucker_id
);

-- Notifications: users can see their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_policy" ON public.notifications
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages: participants in a conversation can read/write
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE TO authenticated USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "messages_delete_policy" ON public.messages
FOR DELETE TO authenticated USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- Shipment requests: truckers can manage their own requests
CREATE POLICY "shipment_requests_select_policy" ON public.shipment_requests
FOR SELECT TO authenticated USING (trucker_id = auth.uid());

CREATE POLICY "shipment_requests_insert_policy" ON public.shipment_requests
FOR INSERT TO authenticated WITH CHECK (trucker_id = auth.uid());

CREATE POLICY "shipment_requests_update_policy" ON public.shipment_requestsFOR UPDATE TO authenticated USING (trucker_id = auth.uid());

CREATE POLICY "shipment_requests_delete_policy" ON public.shipment_requests
FOR DELETE TO authenticated USING (trucker_id = auth.uid());