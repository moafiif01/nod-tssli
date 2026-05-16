-- Tracks which prayer reminders were already sent per day to avoid duplicate pushes.
CREATE TABLE IF NOT EXISTS prayer_notification_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prayer_date DATE NOT NULL,
    prayer_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT prayer_notification_runs_unique UNIQUE (prayer_date, prayer_key)
);

ALTER TABLE prayer_notification_runs ENABLE ROW LEVEL SECURITY;

-- App server (service role) manages this table. End users should not access it directly.
CREATE POLICY "No direct access for authenticated users"
ON prayer_notification_runs
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
