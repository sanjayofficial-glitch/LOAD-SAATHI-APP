-- Create users table that links to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('trucker', 'shipper')) NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_name TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trucker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    departure_date DATE NOT NULL,
    available_capacity_tonnes DECIMAL(10,2) NOT NULL,
    price_per_tonne DECIMAL(10,2) NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    shipper_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    goods_description TEXT NOT NULL,
    weight_tonnes DECIMAL(10,2) NOT NULL,
    pickup_address TEXT,
    delivery_address TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Truckers can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = trucker_id);
CREATE POLICY "Truckers can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = trucker_id);

CREATE POLICY "Requests are viewable by involved parties" ON public.requests FOR SELECT USING (auth.uid() = shipper_id OR auth.uid() IN (SELECT trucker_id FROM public.trips WHERE id = trip_id));
CREATE POLICY "Shippers can insert requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = shipper_id);
CREATE POLICY "Involved parties can update requests" ON public.requests FOR UPDATE USING (auth.uid() = shipper_id OR auth.uid() IN (SELECT trucker_id FROM public.trips WHERE id = trip_id));

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);