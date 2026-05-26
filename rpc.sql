-- Function to log a prayer and safely update the user's points and streak
CREATE OR REPLACE FUNCTION public.log_prayer(
  p_prayer prayer_name,
  p_mosque BOOLEAN,
  p_logged_at timestamptz DEFAULT now(),
  p_local_date TEXT DEFAULT NULL,
  p_tz_offset_minutes INTEGER DEFAULT NULL
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

  -- Determine the user's local "today". If the client provided a local date
  -- and tz offset, use that as the user's day; otherwise derive the UTC date
  -- from the provided timestamp.
  IF p_local_date IS NOT NULL AND p_tz_offset_minutes IS NOT NULL THEN
    v_today := p_local_date::DATE;
  ELSE
    v_today := (p_logged_at AT TIME ZONE 'UTC')::DATE;
  END IF;

  -- Check if already logged today. When the client provides a timezone offset
  -- we must convert stored UTC timestamps to the user's local date before
  -- comparing.
  IF p_local_date IS NOT NULL AND p_tz_offset_minutes IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.prayer_logs
      WHERE user_id = v_user_id
        AND prayer = p_prayer
        AND (((logged_at AT TIME ZONE 'UTC') + (p_tz_offset_minutes || ' minutes')::interval)::DATE) = v_today
    ) THEN
      RAISE EXCEPTION 'Prayer already logged today';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.prayer_logs
      WHERE user_id = v_user_id AND prayer = p_prayer AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today
    ) THEN
      RAISE EXCEPTION 'Prayer already logged today';
    END IF;
  END IF;

  -- Get current user stats
  SELECT current_streak, max_streak INTO v_current_streak, v_max_streak
  FROM public.users WHERE id = v_user_id;

  -- Find the date of their last logged prayer (expressed in user's local
  -- date when tz offset provided).
  IF p_local_date IS NOT NULL AND p_tz_offset_minutes IS NOT NULL THEN
    SELECT (((MAX(logged_at) AT TIME ZONE 'UTC') + (p_tz_offset_minutes || ' minutes')::interval)::DATE)
      INTO v_last_log
    FROM public.prayer_logs WHERE user_id = v_user_id;
  ELSE
    SELECT (MAX(logged_at) AT TIME ZONE 'UTC')::DATE INTO v_last_log
    FROM public.prayer_logs WHERE user_id = v_user_id;
  END IF;

  -- Calculate Points BEFORE inserting
  v_points := 10;
  IF p_mosque THEN
    v_points := v_points + 15;
  END IF;

  -- Insert the log first
  -- Insert using the provided timestamp so server-side date logic aligns with client-local time
  INSERT INTO public.prayer_logs (user_id, prayer, prayed_in_mosque, local_date, points_earned, logged_at)
  VALUES (
    v_user_id,
    p_prayer,
    p_mosque,
    CASE
      WHEN p_local_date IS NOT NULL THEN p_local_date::DATE
      ELSE (p_logged_at AT TIME ZONE 'UTC')::DATE
    END,
    v_points,
    p_logged_at
  );

  -- Count today's and yesterday's total prayers, applying tz offset when
  -- provided so counts reflect the user's local day boundaries.
  IF p_local_date IS NOT NULL AND p_tz_offset_minutes IS NOT NULL THEN
    SELECT COUNT(*) INTO v_today_count FROM public.prayer_logs
    WHERE user_id = v_user_id AND (((logged_at AT TIME ZONE 'UTC') + (p_tz_offset_minutes || ' minutes')::interval)::DATE) = v_today;

    SELECT COUNT(*) INTO v_yesterday_count FROM public.prayer_logs
    WHERE user_id = v_user_id AND (((logged_at AT TIME ZONE 'UTC') + (p_tz_offset_minutes || ' minutes')::interval)::DATE) = (v_today - 1);
  ELSE
    SELECT COUNT(*) INTO v_today_count FROM public.prayer_logs
    WHERE user_id = v_user_id AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today;

    SELECT COUNT(*) INTO v_yesterday_count FROM public.prayer_logs
    WHERE user_id = v_user_id AND (logged_at AT TIME ZONE 'UTC')::DATE = v_today - 1;
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_arafah_dhikr_counter()
RETURNS JSON AS $$
DECLARE
  v_counter RECORD;
BEGIN
  SELECT completed_count, target_count, updated_at
  INTO v_counter
  FROM public.arafah_dhikr_counter
  WHERE id = 1;

  IF NOT FOUND THEN
    INSERT INTO public.arafah_dhikr_counter (id, completed_count, target_count)
    VALUES (1, 0, 5000)
    RETURNING completed_count, target_count, updated_at INTO v_counter;
  END IF;

  RETURN json_build_object(
    'completed_count', v_counter.completed_count,
    'target_count', v_counter.target_count,
    'updated_at', v_counter.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_arafah_dhikr_counter()
RETURNS JSON AS $$
DECLARE
  v_counter RECORD;
BEGIN
  UPDATE public.arafah_dhikr_counter
  SET
    completed_count = LEAST(completed_count + 1, target_count),
    updated_at = timezone('utc'::text, now())
  WHERE id = 1
  RETURNING completed_count, target_count, updated_at INTO v_counter;

  IF NOT FOUND THEN
    INSERT INTO public.arafah_dhikr_counter (id, completed_count, target_count)
    VALUES (1, 1, 5000)
    RETURNING completed_count, target_count, updated_at INTO v_counter;
  END IF;

  RETURN json_build_object(
    'completed_count', v_counter.completed_count,
    'target_count', v_counter.target_count,
    'updated_at', v_counter.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
