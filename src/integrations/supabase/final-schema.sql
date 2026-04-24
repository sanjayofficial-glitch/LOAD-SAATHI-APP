-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (keep as text for Clerk compatibility)
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['trucker'::text, 'shipper'::text])),
  full_name text,
  phone text,
  company_name text,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  total_trips integer DEFAULT 0 CHECK (total_trips >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Trips table
CREATE TABLE public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trucker_id text NOT NULL,  -- References users.id (text)
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  departure_date date NOT NULL,
  available_capacity_tonnes numeric NOT NULL CHECK (available_capacity_tonnes > 0::numeric),
  price_per_tonne numeric NOT NULL CHECK (price_per_tonne > 0::numeric),
  vehicle_type text NOT NULL,
  vehicle_number text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  origin_state text,
  destination_state text,
  CONSTRAINT trips_pkey PRIMARY KEY (id),
  CONSTRAINT trips_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id)
);

-- Shipments table
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipper_id text NOT NULL,  -- References users.id (text)
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  departure_date date NOT NULL,
  goods_description text NOT NULL,
  weight_tonnes numeric NOT NULL CHECK (weight_tonnes > 0::numeric),
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  budget_per_tonne numeric NOT NULL CHECK (budget_per_tonne > 0::numeric),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'matched'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipments_pkey PRIMARY KEY (id),
  CONSTRAINT shipments_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id)
);

-- Requests table (shipper requests to join a trucker's trip)
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  shipper_id text NOT NULL,  -- References users.id (text)
  receiver_id text NOT NULL,  -- References users.id (text) - the trucker
  goods_description text NOT NULL,
  weight_tonnes numeric NOT NULL CHECK (weight_tonnes > 0::numeric),
  pickup_address text,
  delivery_address text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  shipment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (id),
  CONSTRAINT requests_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id),
  CONSTRAINT requests_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id),
  CONSTRAINT requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
  CONSTRAINT requests_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id)
);

-- Shipment requests table (trucker offers to shippers)
CREATE TABLE public.shipment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  trucker_id text NOT NULL,  -- References users.id (text)
  shipper_id text NOT NULL,  -- References users.id (text)
  proposed_price_per_tonne numeric,
  message text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT shipment_requests_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id),
  CONSTRAINT shipment_requests_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id),
  CONSTRAINT shipment_requests_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id)
);

-- Reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  trucker_id text NOT NULL,  -- References users.id (text)
  shipper_id text NOT NULL,  -- References users.id (text)
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id),
  CONSTRAINT reviews_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id),
  CONSTRAINT reviews_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id)
);

-- Messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,  -- References users.id (text)
  recipient_id text NOT NULL,  -- References users.id (text)
  content text NOT NULL,
  request_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  shipment_request_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id),
  CONSTRAINT messages_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id),
  CONSTRAINT messages_shipment_request_id_fkey FOREIGN KEY (shipment_request_id) REFERENCES public.shipment_requests(id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- References users.id (text)
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_trip_id uuid,
  related_shipment_request_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  type text,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_related_trip_id_fkey FOREIGN KEY (related_trip_id) REFERENCES public.trips(id),
  CONSTRAINT notifications_related_shipment_request_id_fkey FOREIGN KEY (related_shipment_request_id) REFERENCES public.shipment_requests(id)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can see own profile" ON public.users
FOR SELECT TO authenticated USING (auth.uid()::text = id);

-- Trips policies
CREATE POLICY "Anyone can see active trips" ON public.trips
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Truckers can create trips" ON public.trips
FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = trucker_id);

CREATE POLICY "Truckers can update own trips" ON public.trips
FOR UPDATE TO authenticated USING (auth.uid()::text = trucker_id);

CREATE POLICY "Truckers can delete own trips" ON public.trips
FOR DELETE TO authenticated USING (auth.uid()::text = trucker_id);

-- Shipments policies
CREATE POLICY "Anyone can see pending shipments" ON public.shipments
FOR SELECT TO authenticated USING (status = 'pending');

CREATE POLICY "Shippers can create shipments" ON public.shipments
FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = shipper_id);

CREATE POLICY "Shippers can update own shipments" ON public.shipments
FOR UPDATE TO authenticated USING (auth.uid()::text = shipper_id);

CREATE POLICY "Shippers can delete own shipments" ON public.shipments
FOR DELETE TO authenticated USING (auth.uid()::text = shipper_id);

-- Requests policies
CREATE POLICY "Truckers can see requests for their trips" ON public.requests
FOR SELECT TO authenticated USING (
  auth.uid()::text = receiver_id OR 
  trip_id IN (SELECT id FROM trips WHERE trucker_id = auth.uid()::text)
);

CREATE POLICY "Shippers can create requests" ON public.requests
FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = shipper_id);

CREATE POLICY "Shippers can update own requests" ON public.requests
FOR UPDATE TO authenticated USING (auth.uid()::text = shipper_id);

-- Shipment requests policies
CREATE POLICY "Shippers can see requests for their shipments" ON public.shipment_requests
FOR SELECT TO authenticated USING (
  auth.uid()::text = shipper_id OR 
  shipment_id IN (SELECT id FROM shipments WHERE shipper_id = auth.uid()::text)
);

CREATE POLICY "Truckers can create shipment requests" ON public.shipment_requests
FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = trucker_id);

CREATE POLICY "Truckers can update own shipment requests" ON public.shipment_requests
FOR UPDATE TO authenticated USING (auth.uid()::text = trucker_id);

-- Reviews policies
CREATE POLICY "Anyone can see reviews" ON public.reviews
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Shippers can create reviews" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = shipper_id);

-- Messages policies
CREATE POLICY "Users can see their messages" ON public.messages
FOR SELECT TO authenticated USING (
  auth.uid()::text = sender_id OR 
  auth.uid()::text = recipient_id
);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid()::text = sender_id
);

-- Notifications policies
CREATE POLICY "Users can see their notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);