ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS origin_state TEXT,
ADD COLUMN IF NOT EXISTS destination_state TEXT;