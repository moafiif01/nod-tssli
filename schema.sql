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

-- Dhul Hijjah Challenge Tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'challenge_key_name'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.challenge_key_name AS ENUM ('dhu_al_hijjah');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_key challenge_key_name NOT NULL DEFAULT 'dhu_al_hijjah',
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,
  alias_lower TEXT GENERATED ALWAYS AS (lower(alias)) STORED,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (challenge_key, user_id),
  CHECK (char_length(alias) BETWEEN 2 AND 20)
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_participants_unique_alias
ON public.challenge_participants (challenge_key, alias_lower);

CREATE TABLE IF NOT EXISTS public.challenge_daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_key challenge_key_name NOT NULL DEFAULT 'dhu_al_hijjah',
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  quran_tumuns INTEGER DEFAULT 0 NOT NULL,
  siyam BOOLEAN DEFAULT false NOT NULL,
  chaf3 BOOLEAN DEFAULT false NOT NULL,
  witr BOOLEAN DEFAULT false NOT NULL,
  quran_points INTEGER DEFAULT 0 NOT NULL,
  siyam_points INTEGER DEFAULT 0 NOT NULL,
  chaf3_points INTEGER DEFAULT 0 NOT NULL,
  witr_points INTEGER DEFAULT 0 NOT NULL,
  challenge_points INTEGER DEFAULT 0 NOT NULL,
  alias_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (challenge_key, user_id, entry_date),
  CHECK (quran_tumuns >= 0)
);

CREATE INDEX IF NOT EXISTS challenge_daily_entries_user_idx ON public.challenge_daily_entries (user_id, entry_date);
CREATE INDEX IF NOT EXISTS challenge_daily_entries_date_idx ON public.challenge_daily_entries (challenge_key, entry_date);

-- Shared Arafah Dhikr Counter
CREATE TABLE IF NOT EXISTS public.arafah_dhikr_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  completed_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 5000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.arafah_dhikr_counter (id, completed_count, target_count)
VALUES (1, 0, 5000)
ON CONFLICT (id) DO NOTHING;

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
ALTER TABLE public.arafah_dhikr_counter ENABLE ROW LEVEL SECURITY;

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
    ON public.prayer_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;


  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'arafah_dhikr_counter' AND policyname = 'Arafah counter viewable by everyone'
  ) THEN
    CREATE POLICY "Arafah counter viewable by everyone"
    ON public.arafah_dhikr_counter FOR SELECT USING (true);
  END IF;
END
$$;

-- SECURITY LOCKDOWN: Prevent users from arbitrarily changing their points/streaks
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name, university) ON public.users TO authenticated;

-- Public access is limited to aggregate views owned by the database owner.
-- Definer semantics intentionally aggregate all users; no identities or raw logs
-- are exposed. Run this setup as postgres (the Supabase database owner).
ALTER VIEW public.community_stats SET (security_invoker = false, security_barrier = true);
ALTER VIEW public.community_stats OWNER TO postgres;
REVOKE ALL ON public.community_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.community_stats TO anon, authenticated;

CREATE OR REPLACE VIEW public.community_weekly_points
WITH (security_invoker = false, security_barrier = true) AS
SELECT COALESCE(SUM(points_earned), 0)::bigint AS total_points
FROM public.prayer_logs
WHERE logged_at >= now() - interval '7 days';
ALTER VIEW public.community_weekly_points OWNER TO postgres;
REVOKE ALL ON public.community_weekly_points FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.community_weekly_points TO anon, authenticated;

-- Remove the legacy permissive policy even when schema.sql is reapplied.
DROP POLICY IF EXISTS "Community stats viewable by everyone" ON public.prayer_logs;
REVOKE ALL ON public.prayer_logs FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.prayer_logs TO authenticated;
