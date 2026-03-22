-- 1. Add missing SELECT policies for the users table
-- This allows authenticated users to see their own and others' profiles (needed for names/ratings)
CREATE POLICY "Users can read all profiles" ON public.users
FOR SELECT TO authenticated USING (true);

-- 2. Simplify the notify_new_trip function to avoid redundant database lookups
CREATE OR REPLACE FUNCTION public.notify_new_trip()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use NEW directly instead of selecting from the table again
  INSERT INTO public.notifications (user_id, message, related_trip_id)
  VALUES (NEW.trucker_id, 'New trip posted: ' || NEW.origin_city || ' → ' || NEW.destination_city, NEW.id);
  
  RETURN NEW;
END;
$function$;

-- 3. Ensure RLS is enabled on all tables (just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;