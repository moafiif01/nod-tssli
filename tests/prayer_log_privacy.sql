-- Run only in an empty, disposable PostgreSQL 15+ database as a superuser.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
\ir ../schema.sql
\ir ../rpc.sql

-- Simulate the vulnerable deployed grants/policy before applying the migration.
GRANT ALL ON public.prayer_logs TO anon, authenticated;
CREATE POLICY "Community stats viewable by everyone"
ON public.prayer_logs FOR SELECT USING (true);
\ir ../migrations/20260905_protect_prayer_logs.sql
-- Verify reruns are safe too.
\ir ../migrations/20260905_protect_prayer_logs.sql

BEGIN;
INSERT INTO auth.users VALUES
('00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002');
INSERT INTO public.users (id, email) SELECT id, id || '@example.test' FROM auth.users;
INSERT INTO public.prayer_logs (user_id, prayer, logged_at, points_earned) VALUES
('00000000-0000-0000-0000-000000000001', 'fajr', now(), 10),
('00000000-0000-0000-0000-000000000002', 'fajr', now(), 25),
('00000000-0000-0000-0000-000000000002', 'isha', now() - interval '8 days', 99);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.prayer_logs) <> 1 THEN
    RAISE EXCEPTION 'A must see only own log';
  END IF;
  IF EXISTS (SELECT FROM public.prayer_logs WHERE user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'Cross-user read allowed';
  END IF;
  BEGIN
    INSERT INTO public.prayer_logs (user_id, prayer, points_earned)
    VALUES ('00000000-0000-0000-0000-000000000002', 'asr', 10);
    RAISE EXCEPTION 'Cross-user insert allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM public.log_prayer('dhuhr', false);
  IF (SELECT count(*) FROM public.prayer_logs WHERE user_id = auth.uid()) <> 2 THEN
    RAISE EXCEPTION 'RPC did not log for A';
  END IF;
  IF (SELECT total_points FROM public.community_weekly_points) IS DISTINCT FROM 45::bigint THEN
    RAISE EXCEPTION 'Authenticated weekly aggregate incorrect';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.prayer_logs) <> 2 OR
     EXISTS (SELECT FROM public.prayer_logs WHERE user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'B must see only own logs';
  END IF;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$ BEGIN
  BEGIN
    PERFORM * FROM public.prayer_logs;
    RAISE EXCEPTION 'Anonymous read allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF (SELECT total_points FROM public.community_weekly_points) IS DISTINCT FROM 45::bigint THEN
    RAISE EXCEPTION 'Anonymous weekly aggregate incorrect';
  END IF;
  IF (SELECT total_prayers FROM public.community_stats
      WHERE prayer = 'fajr' AND stat_date = (now() AT TIME ZONE 'UTC')::date) IS DISTINCT FROM 2::bigint THEN
    RAISE EXCEPTION 'Public Fajr aggregate incorrect';
  END IF;
END $$;
ROLLBACK;
-- Empty input must return one zero-valued aggregate row.
SET ROLE anon;
DO $$ BEGIN
  IF (SELECT total_points FROM public.community_weekly_points) IS DISTINCT FROM 0::bigint THEN
    RAISE EXCEPTION 'Empty weekly aggregate incorrect';
  END IF;
END $$;
RESET ROLE;
