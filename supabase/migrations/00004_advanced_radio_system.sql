-- Add type and scheduling to tracks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audio_type') THEN
        CREATE TYPE audio_type AS ENUM ('song', 'jingle', 'news', 'adhan', 'program');
    END IF;
END $$;

ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS type audio_type DEFAULT 'song';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS scheduled_time TIME; -- For fixed time items like Adhan
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ;

-- Create radio_session for live synchronization
CREATE TABLE IF NOT EXISTS public.radio_session (
    id SERIAL PRIMARY KEY,
    current_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure there is always a session row
INSERT INTO public.radio_session (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Policies for radio_session
ALTER TABLE public.radio_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read radio_session" ON public.radio_session FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update radio_session" ON public.radio_session FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Enable Realtime for radio_session
ALTER PUBLICATION supabase_realtime ADD TABLE public.radio_session;
