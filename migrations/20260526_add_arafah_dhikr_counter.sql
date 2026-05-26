-- Shared Arafah Dhikr Counter
CREATE TABLE IF NOT EXISTS public.arafah_dhikr_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  completed_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 5000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.arafah_dhikr_counter (id, completed_count, target_count)
VALUES (1, 0, 5000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.arafah_dhikr_counter ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'arafah_dhikr_counter' AND policyname = 'Arafah counter viewable by everyone'
  ) THEN
    CREATE POLICY "Arafah counter viewable by everyone"
    ON public.arafah_dhikr_counter FOR SELECT USING (true);
  END IF;
END
$$;