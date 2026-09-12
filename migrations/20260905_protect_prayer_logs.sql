-- Apply as the Supabase database owner before deploying the dashboard change.
BEGIN;
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own prayer logs" ON public.prayer_logs;
CREATE POLICY "Users can view their own prayer logs"
ON public.prayer_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

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

COMMIT;
