-- Users Table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('trucker', 'shipper')),
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  total_trips INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips Table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trucker_id UUID REFERENCES public.users(id),
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date TIMESTAMPTZ NOT NULL,
  available_capacity_tonnes NUMERIC NOT NULL DEFAULT 0,
  price_per_tonne NUMERIC NOT NULL DEFAULT 0,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requests Table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id),
  shipper_id UUID REFERENCES public.users(id),
  goods_description TEXT NOT NULL,
  weight_tonnes NUMERIC NOT NULL DEFAULT 0,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_trip_id UUID REFERENCES public.trips(id)
);

-- Add public read access policy for trips table
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for trips" ON public.trips
FOR SELECT USING (true);

-- Add public read access policy for requests table
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for requests" ON public.requests
FOR SELECT USING (true);

-- Function to update trip capacity when request status changes
CREATE OR REPLACE FUNCTION public.update_trip_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND NEW.trip_id IS NOT NULL THEN
    UPDATE public.trips 
    SET available_capacity_tonnes = available_capacity_tonnes - NEW.weight_tonnes 
    WHERE id = NEW.trip_id;
  ELSIF NEW.status IN ('declined', 'cancelled') AND OLD.status = 'accepted' AND OLD.trip_id IS NOT NULL THEN
    UPDATE public.trips 
    SET available_capacity_tonnes = available_capacity_tonnes + OLD.weight_tonnes 
    WHERE id = OLD.trip_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for capacity updates
DROP TRIGGER IF EXISTS on_request_status_updated ON public.requests;
CREATE TRIGGER on_request_status_updated
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_trip_capacity();

-- Function to notify when new trip is posted
CREATE OR REPLACE FUNCTION public.notify_new_trip()
RETURNS TRIGGER AS $$
DECLARE
  v_trucker_id UUID;
BEGIN
  SELECT trucker_id INTO v_trucker_id FROM public.trips WHERE id = NEW.id;
  
  INSERT INTO public.notifications (user_id, message, related_trip_id)
  VALUES (v_trucker_id, 'New trip posted: ' || NEW.origin_city || ' → ' || NEW.destination_city, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new trip notifications
DROP TRIGGER IF EXISTS on_trip_created ON public.trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_trip();