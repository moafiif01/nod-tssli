-- Function to log a prayer and safely update the user's points and streak
CREATE OR REPLACE FUNCTION public.log_prayer(
  p_prayer prayer_name,
  p_mosque BOOLEAN,
  p_logged_at timestamptz DEFAULT now()
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_points INTEGER;
  v_current_streak INTEGER;
  v_max_streak INTEGER;
  v_last_log DATE;
  v_today DATE;
  v_diff_days INTEGER;
  v_today_count INTEGER;
  v_yesterday_count INTEGER;
BEGIN
  -- Get the currently authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Determine the "today" date in UTC based on the provided timestamp (client can send local time as ISO)
  v_today := (p_logged_at AT TIME ZONE 'UTC')::DATE;

  -- Check if already logged today
  IF EXISTS (
    SELECT 1 FROM public.prayer_logs 
    WHERE user_id = v_user_id AND prayer = p_prayer AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today
  ) THEN
    RAISE EXCEPTION 'Prayer already logged today';
  END IF;

  -- Get current user stats
  SELECT current_streak, max_streak INTO v_current_streak, v_max_streak
  FROM public.users WHERE id = v_user_id;

  -- Find the date of their last logged prayer
  SELECT (MAX(logged_at) AT TIME ZONE 'UTC')::DATE INTO v_last_log
  FROM public.prayer_logs WHERE user_id = v_user_id;

  -- Calculate Points BEFORE inserting
  v_points := 10;
  IF p_mosque THEN
    v_points := v_points + 15;
  END IF;

  -- Insert the log first
  -- Insert using the provided timestamp so server-side date logic aligns with client-local time
  INSERT INTO public.prayer_logs (user_id, prayer, prayed_in_mosque, points_earned, logged_at)
  VALUES (v_user_id, p_prayer, p_mosque, v_points, p_logged_at);

  -- Count today's total prayers
  SELECT COUNT(*) INTO v_today_count FROM public.prayer_logs 
  WHERE user_id = v_user_id AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today;

  -- Count yesterday's total prayers
  SELECT COUNT(*) INTO v_yesterday_count FROM public.prayer_logs 
  WHERE user_id = v_user_id AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today - 1;

  -- Calculate Streak (Requires 5/5 to increment)
  IF v_today_count = 5 THEN
    IF v_yesterday_count = 5 THEN
      -- They got 5/5 yesterday, so they successfully continue the streak!
      v_current_streak := v_current_streak + 1;
    ELSE
      -- They hit 5/5 today, but didn't yesterday. Start fresh at 1.
      v_current_streak := 1;
    END IF;

    -- Update max streak
    IF v_current_streak > v_max_streak THEN
      v_max_streak := v_current_streak;
    END IF;
  ELSE
    -- They haven't hit 5/5 today yet.
    IF v_yesterday_count < 5 THEN
      -- They also didn't hit 5/5 yesterday. The streak is dead.
      v_current_streak := 0;
    END IF;
    -- If v_yesterday_count = 5, they are still "in" the streak (they have until midnight to finish today's 5/5), so leave it as is.
  END IF;

  -- Update user profile (Security Definer allows bypassing the REVOKE UPDATE)
  UPDATE public.users 
  SET 
    current_streak = v_current_streak,
    max_streak = v_max_streak,
    total_points = total_points + v_points
  WHERE id = v_user_id;

  RETURN json_build_object(
    'points_earned', v_points,
    'current_streak', v_current_streak,
    'total_points', (SELECT total_points FROM public.users WHERE id = v_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
