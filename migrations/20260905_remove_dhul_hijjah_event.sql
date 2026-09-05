-- Apply after deploying the event removal and stopping event reminder jobs.
-- Intentionally omit CASCADE: unexpected dependencies must stop the migration.
BEGIN;
SET LOCAL lock_timeout = '5s';

DROP FUNCTION IF EXISTS public.get_arafah_dhikr_counter();
DROP FUNCTION IF EXISTS public.increment_arafah_dhikr_counter();
DROP TABLE IF EXISTS public.challenge_daily_entries;
DROP TABLE IF EXISTS public.challenge_participants;
DROP TABLE IF EXISTS public.arafah_dhikr_counter;
DROP TYPE IF EXISTS public.challenge_key_name;

COMMIT;
