-- Function to notify trucker of new request
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER AS $$
DECLARE
  v_trucker_id UUID;
BEGIN
  SELECT trucker_id INTO v_trucker_id FROM public.trips WHERE id = NEW.trip_id;
  
  INSERT INTO public.notifications (user_id, message, related_trip_id)
  VALUES (v_trucker_id, 'New booking request for your trip: ' || NEW.goods_description, NEW.trip_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new requests
DROP TRIGGER IF EXISTS on_request_created ON public.requests;
CREATE TRIGGER on_request_created
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_request();

-- Function to notify shipper of request status change
CREATE OR REPLACE FUNCTION public.notify_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO public.notifications (user_id, message, related_trip_id)
    VALUES (NEW.shipper_id, 'Your booking request for ' || NEW.goods_description || ' was ' || NEW.status, NEW.trip_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for status updates
DROP TRIGGER IF EXISTS on_request_status_updated ON public.requests;
CREATE TRIGGER on_request_status_updated
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_status_change();