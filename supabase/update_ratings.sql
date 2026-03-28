-- Function to update the trucker's average rating
CREATE OR REPLACE FUNCTION public.update_trucker_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate the new average rating for the trucker
  UPDATE public.users
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews
    WHERE trucker_id = NEW.trucker_id
  ),
  total_trips = (
    SELECT COUNT(DISTINCT trip_id)
    FROM public.reviews
    WHERE trucker_id = NEW.trucker_id
  )
  WHERE id = NEW.trucker_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after a review is inserted or updated
DROP TRIGGER IF EXISTS on_review_upsert ON public.reviews;
CREATE TRIGGER on_review_upsert
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trucker_rating();

-- Trigger to run the function after a review is deleted
DROP TRIGGER IF EXISTS on_review_delete ON public.reviews;
CREATE TRIGGER on_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trucker_rating();