-- Migration: drop quran_pages column
-- WARNING: Run ONLY after you've verified `quran_tumuns` is populated and the app works.
-- Backup production DB before running this.

BEGIN;

-- Remove legacy column (if exists). This will fail if other DB objects depend on this column.
ALTER TABLE public.challenge_daily_entries
  DROP COLUMN IF EXISTS quran_pages;

COMMIT;

-- Rollback (manual):
-- BEGIN;
-- ALTER TABLE public.challenge_daily_entries ADD COLUMN quran_pages INTEGER DEFAULT 0 NOT NULL;
-- UPDATE public.challenge_daily_entries SET quran_pages = ROUND(COALESCE(quran_tumuns,0) * 1.25);
-- COMMIT;
