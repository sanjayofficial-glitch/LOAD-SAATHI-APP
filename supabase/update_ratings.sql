CREATE OR REPLACE FUNCTION public.update_trucker_ratings()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate average rating for the trucker
  DECLARE avg_rating NUMERIC;
  DECLARE review_count INTEGER;
  
  SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
  FROM public.reviews
  WHERE trucker_id = NEW.trucker_id;
  
  -- Update the trucker's rating in users table
  UPDATE public.users
  SET rating = COALESCE(avg_rating, 0),
      total_trips = review_count
  WHERE id = NEW.trucker_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update ratings when a new review is inserted
DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_trucker_ratings();