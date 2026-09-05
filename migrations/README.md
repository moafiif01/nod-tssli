# Database changes

`schema.sql` and `rpc.sql` describe the current database setup. Apply incremental
SQL files only to the databases that need them; these are manually managed scripts.
The retired event's setup and Quran conversion scripts have been removed.

## Retire the Dhul Hijjah event

1. Deploy this change and the updated GitHub Actions workflows. Confirm no external
   scheduler still sends event notifications. Release any separate native mobile
   client changes before removing tables. The installed web app uses the same UI
   as the website and its service worker does not cache pages.
2. Export the event tables if their historical records need to be retained.
3. Run `20260905_remove_dhul_hijjah_event.sql` against the production database with
   a database owner connection, for example:

   ```sh
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20260905_remove_dhul_hijjah_event.sql
   ```

   This permanently removes event entries, participants, the Arafah counter,
   its two RPC functions, and the event enum. Table indexes and policies are
   removed with their tables. User accounts, prayer logs, points, streaks, and
   prayer notification subscriptions are preserved. The transaction fails on
   unexpected dependencies instead of deleting them with CASCADE. It is safe to
   rerun after successful completion.
4. Remove obsolete deployment variables: `NEXT_PUBLIC_CHALLENGE_START_DATE`,
   `NEXT_PUBLIC_CHALLENGE_END_DATE`, `CHALLENGE_REMINDER_TIMEZONE`, and
   `CHALLENGE_REMINDER_HOUR`.
5. Verify the home page on desktop and mobile, prayer check-in, and community
   stats. Removed event APIs should return 404. Verify the dropped objects:

   ```sql
   SELECT to_regclass('public.challenge_daily_entries'),
          to_regclass('public.challenge_participants'),
          to_regclass('public.arafah_dhikr_counter'),
          to_regprocedure('public.get_arafah_dhikr_counter()'),
          to_regprocedure('public.increment_arafah_dhikr_counter()'),
          to_regtype('public.challenge_key_name');
   ```

   All results should be NULL. Restoring event data requires an export/backup;
   reverting application code alone will not restore these tables.
