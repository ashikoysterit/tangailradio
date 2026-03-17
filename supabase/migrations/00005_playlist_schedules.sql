-- Create playlist schedules table for time-based scheduling
CREATE TABLE IF NOT EXISTS public.playlist_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    track_ids UUID[] NOT NULL DEFAULT '{}',
    days_of_week INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.playlist_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active schedules" ON public.playlist_schedules 
    FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Admins can manage schedules" ON public.playlist_schedules 
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create weather cache table
CREATE TABLE IF NOT EXISTS public.weather_cache (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial row
INSERT INTO public.weather_cache (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read weather" ON public.weather_cache 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role can update weather" ON public.weather_cache 
    FOR UPDATE USING (true);
