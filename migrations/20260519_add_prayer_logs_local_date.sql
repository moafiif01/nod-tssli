-- Add local_date to prayer_logs so salawat can be grouped by the user's real local day.
ALTER TABLE public.prayer_logs
  ADD COLUMN IF NOT EXISTS local_date DATE;

-- Backfill existing rows from their stored UTC timestamps so legacy data keeps working.
UPDATE public.prayer_logs
SET local_date = (logged_at AT TIME ZONE 'UTC')::DATE
WHERE local_date IS NULL;

-- Replace the old per-day unique rule with a local-date aware version.
DROP INDEX IF EXISTS public.unique_prayer_per_day;
CREATE UNIQUE INDEX IF NOT EXISTS unique_prayer_per_day
ON public.prayer_logs (user_id, prayer, COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)));

-- Keep community stats aligned with the same day key.
CREATE OR REPLACE VIEW public.community_stats AS
SELECT
  COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)) as stat_date,
  prayer,
  COUNT(*) as total_prayers,
  SUM(CASE WHEN prayed_in_mosque THEN 1 ELSE 0 END) as total_in_mosque
FROM public.prayer_logs
GROUP BY COALESCE(local_date, ((logged_at AT TIME ZONE 'UTC')::DATE)), prayer;
