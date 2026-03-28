-- Function to notify trucker when a new review is posted
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, related_trip_id)
  VALUES (
    NEW.trucker_id,
    'You received a new ' || NEW.rating || '-star review!',
    NEW.trip_id
  );
  RETURN NEW;
END;
$$;

-- Trigger the function on review insertion
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();