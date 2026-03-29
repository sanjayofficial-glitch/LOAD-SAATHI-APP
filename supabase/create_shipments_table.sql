-- Create shipments table for shippers to post their goods
CREATE TABLE public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  goods_description TEXT NOT NULL,
  weight_tonnes NUMERIC NOT NULL CHECK (weight_tonnes > 0),
  pickup_address TEXT,
  delivery_address TEXT,
  budget_per_tonne NUMERIC NOT NULL CHECK (budget_per_tonne > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation
CREATE POLICY "shipments_select_policy" ON public.shipments
FOR SELECT TO authenticated USING (shipper_id = auth.uid());

CREATE POLICY "shipments_insert_policy" ON public.shipments
FOR INSERT TO authenticated WITH CHECK (shipper_id = auth.uid());

CREATE POLICY "shipments_update_policy" ON public.shipments
FOR UPDATE TO authenticated USING (shipper_id = auth.uid());

CREATE POLICY "shipments_delete_policy" ON public.shipments
FOR DELETE TO authenticated USING (shipper_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipments_updated_at ON public.shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();