-- Migration: add quran_tumuns and populate from existing quran_pages
-- Run this on dev/staging first, verify, then run on production AFTER taking a backup.

BEGIN;

-- 1) Add new integer column (non-null, default 0)
ALTER TABLE public.challenge_daily_entries
  ADD COLUMN IF NOT EXISTS quran_tumuns INTEGER DEFAULT 0 NOT NULL;

-- 2) Populate tumuns from legacy pages where appropriate.
--    Conversion: 1 tumun (أثمن) ≈ 1.25 pages. Use ROUND(pages/1.25) to convert.
UPDATE public.challenge_daily_entries
SET quran_tumuns = ROUND(COALESCE(quran_pages, 0)::numeric / 1.25);

-- 3) Ensure non-negative values
ALTER TABLE public.challenge_daily_entries
  ADD CONSTRAINT IF NOT EXISTS check_quran_tumuns_nonnegative CHECK (quran_tumuns >= 0);

COMMIT;

-- Rollback (manual):
-- BEGIN;
-- ALTER TABLE public.challenge_daily_entries DROP CONSTRAINT IF EXISTS check_quran_tumuns_nonnegative;
-- ALTER TABLE public.challenge_daily_entries DROP COLUMN IF EXISTS quran_tumuns;
-- COMMIT;
