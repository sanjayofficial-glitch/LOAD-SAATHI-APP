-- 1. TABLES SETUP

-- Public users table (profiles)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('trucker', 'shipper')),
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table (posted by truckers)
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trucker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  available_capacity_tonnes NUMERIC NOT NULL DEFAULT 0,
  price_per_tonne NUMERIC NOT NULL DEFAULT 0,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table (bookings by shippers)
CREATE TABLE public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  shipper_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  goods_description TEXT NOT NULL,
  weight_tonnes NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (chat between trucker and shipper)
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  shipper_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  trucker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, shipper_id)
);

-- 2. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trips Policies
CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Truckers can insert own trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = trucker_id);
CREATE POLICY "Truckers can update own trips" ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = trucker_id);
CREATE POLICY "Truckers can delete own trips" ON public.trips FOR DELETE TO authenticated USING (auth.uid() = trucker_id);

-- Requests Policies
CREATE POLICY "Users can see requests they are involved in" ON public.requests FOR SELECT TO authenticated 
USING (auth.uid() = shipper_id OR auth.uid() IN (SELECT trucker_id FROM public.trips WHERE id = trip_id));
CREATE POLICY "Shippers can insert requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = shipper_id);
CREATE POLICY "Involved parties can update requests" ON public.requests FOR UPDATE TO authenticated 
USING (auth.uid() = shipper_id OR auth.uid() IN (SELECT trucker_id FROM public.trips WHERE id = trip_id));

-- Messages Policies
CREATE POLICY "Involved parties can see messages" ON public.messages FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND (r.shipper_id = auth.uid() OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = r.trip_id AND t.trucker_id = auth.uid()))));
CREATE POLICY "Involved parties can insert messages" ON public.messages FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- Notifications Policies
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Shippers can insert reviews for their trips" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = shipper_id);

-- 3. FUNCTIONS & TRIGGERS

-- Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, user_type, company_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'shipper'),
    new.raw_user_meta_data ->> 'company_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update trip capacity when request is accepted
CREATE OR REPLACE FUNCTION public.update_trip_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE public.trips 
    SET available_capacity_tonnes = available_capacity_tonnes - NEW.weight_tonnes 
    WHERE id = NEW.trip_id;
    
    -- Notify shipper
    INSERT INTO public.notifications (user_id, message, related_trip_id)
    VALUES (NEW.shipper_id, 'Your booking request has been accepted!', NEW.trip_id);
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    -- Notify shipper
    INSERT INTO public.notifications (user_id, message, related_trip_id)
    VALUES (NEW.shipper_id, 'Your booking request was declined.', NEW.trip_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_request_status_updated
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_trip_capacity();

-- Notify trucker of new request
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER AS $$
DECLARE
  v_trucker_id UUID;
BEGIN
  SELECT trucker_id INTO v_trucker_id FROM public.trips WHERE id = NEW.trip_id;
  
  INSERT INTO public.notifications (user_id, message, related_trip_id)
  VALUES (v_trucker_id, 'New booking request received for your trip!', NEW.trip_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_request_created
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_request();