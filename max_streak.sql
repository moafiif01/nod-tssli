-- Function to safely get the maximum streak across all users for the Community Dashboard
CREATE OR REPLACE FUNCTION public.get_max_streak()
RETURNS INTEGER AS $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT MAX(max_streak) INTO v_max FROM public.users;
  RETURN COALESCE(v_max, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
