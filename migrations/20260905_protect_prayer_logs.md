# Prayer log privacy (issue #1)

Apply `20260905_protect_prayer_logs.sql` as `postgres`, the Supabase database
owner, before deploying the dashboard change. This transaction is safe to rerun.
Changing repository SQL alone does not protect an existing database.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20260905_protect_prayer_logs.sql
```

The migration removes the legacy public SELECT policy, revokes anonymous table
access, and retains authenticated users' own-log reads and existing insert rules.
The dashboard reads `community_weekly_points` instead of individual point records.
Its single row sums the last seven days on the database server, including all users
and avoiding API row limits. The existing daily prayer/mosque counts remain public.
Both aggregate views deliberately run with the database owner's privileges and
have SELECT-only client grants and a security barrier. Do not add identity or raw
log columns to these views or switch them to invoker privileges: the latter would
break anonymous aggregate reads. No service-role key is needed by the dashboard.

Before declaring production protected, inspect the actual policies and grants:

```sql
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prayer_logs';
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'prayer_logs';
SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'prayer_logs';
SELECT c.relname, c.relowner::regrole, c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('community_stats', 'community_weekly_points');
```

Investigate any additional permissive SELECT/ALL policies or anonymous column
or inherited grants introduced outside this repository. Verify with two staging
test accounts using public API keys: A sees A's logs, A cannot see or insert B's
logs, anonymous raw reads are denied, and both aggregate views work anonymously.
No deployed Supabase configuration or real user records were inspected for this fix.

## Local regression test

Run against an **empty disposable PostgreSQL 15+ instance**, as a superuser;
the test creates mock Supabase auth roles and tables. Do not run it in production.

```sh
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/prayer_log_privacy.sql
```

It applies the schema and prayer RPC, simulates the vulnerable policy/grants,
applies the migration twice, and checks own/cross-user reads, denied cross-user
inserts, RPC identity, anonymous denial, public aggregates, the seven-day cutoff,
and the zero result for empty logs. The auth shim exercises PostgreSQL RLS but
does not replace a staging check of Supabase JWT/API configuration.
