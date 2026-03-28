-- Create reviews table with unique constraint
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  shipper_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trucker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- This ensures a shipper can only rate a specific trip once
  CONSTRAINT reviews_trip_id_shipper_id_key UNIQUE (trip_id, shipper_id)
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation (using DROP first to allow re-running)
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
CREATE POLICY "reviews_select_policy" ON public.reviews
FOR SELECT TO authenticated USING (
  (shipper_id = auth.uid()) OR (trucker_id = auth.uid())
);

DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
CREATE POLICY "reviews_insert_policy" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (shipper_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
CREATE POLICY "reviews_update_policy" ON public.reviews
FOR UPDATE TO authenticated USING (shipper_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_policy" ON public.reviews;
CREATE POLICY "reviews_delete_policy" ON public.reviews
FOR DELETE TO authenticated USING (shipper_id = auth.uid());