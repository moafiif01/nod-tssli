Supabase Edge Function: send-notifications

What it does:
- Fetches rows from `push_subscriptions` and sends a JSON payload via Web Push (VAPID).

Env vars required (set these in Supabase Function settings or in your environment):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- `CRON_SECRET` (shared secret to protect endpoint)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Deploy:
1. Install Supabase CLI and log in.
2. From repo root run:

```bash
supabase functions deploy send-notifications --project-ref <your-project-ref>
```

Call from scheduler or GitHub Actions (example):

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"title": "حان وقت الصلاة","body":"صلي الآن","url":"/"}}' \
  https://<project>.functions.supabase.co/send-notifications
```

Notes:
- If your Supabase plan supports scheduled functions, you can schedule this function directly in Supabase.
- The function uses the Supabase service role key to query and delete expired subscriptions.
