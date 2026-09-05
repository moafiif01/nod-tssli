-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  university TEXT DEFAULT 'ENSAM Rabat',
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prayer Logs Table
-- Records every time a user checks in for a prayer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'prayer_name'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.prayer_name AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prayer prayer_name NOT NULL,
  prayed_in_mosque BOOLEAN DEFAULT false,
  local_date DATE,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  points_earned INTEGER NOT NULL
  
  -- Unique constraint handled via index below
);

-- Ensure a user can only log a specific prayer once per local day when available
CREATE UNIQUE INDEX IF NOT EXISTS unique_prayer_per_day
ON public.prayer_logs (user_id, prayer, COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)));

-- Community Stats (View)
-- Useful for the public-facing dashboard
CREATE OR REPLACE VIEW public.community_stats AS
SELECT 
  COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)) as stat_date,
  prayer,
  COUNT(*) as total_prayers,
  SUM(CASE WHEN prayed_in_mosque THEN 1 ELSE 0 END) as total_in_mosque
FROM 
  public.prayer_logs
GROUP BY 
  COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)), prayer;

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prayer_logs' AND policyname = 'Users can insert their own prayer logs'
  ) THEN
    CREATE POLICY "Users can insert their own prayer logs"
    ON public.prayer_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prayer_logs' AND policyname = 'Users can view their own prayer logs'
  ) THEN
    CREATE POLICY "Users can view their own prayer logs"
    ON public.prayer_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prayer_logs' AND policyname = 'Community stats viewable by everyone'
  ) THEN
    CREATE POLICY "Community stats viewable by everyone"
    ON public.prayer_logs FOR SELECT USING (true);
  END IF;

END
$$;

-- SECURITY LOCKDOWN: Prevent users from arbitrarily changing their points/streaks
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name, university) ON public.users TO authenticated;
