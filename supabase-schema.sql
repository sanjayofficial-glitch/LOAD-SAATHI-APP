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

-- Create trigger for capacity updatesDROP TRIGGER IF EXISTS on_request_status_updated ON public.requests;
CREATE TRIGGER on_request_status_updated
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_trip_capacity();

-- Function to notify when new trip is postedCREATE OR REPLACE FUNCTION public.notify_new_trip()
RETURNS TRIGGER AS $$DECLARE
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