-- QuickCarts Table
CREATE TABLE IF NOT EXISTS public.quick_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    color TEXT DEFAULT 'bg-primary',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clocks Table (Hour Templates)
CREATE TABLE IF NOT EXISTS public.clocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clock Items (Segments within a clock)
CREATE TABLE IF NOT EXISTS public.clock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clock_id UUID REFERENCES public.clocks(id) ON DELETE CASCADE,
    start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 60),
    end_minute INTEGER NOT NULL CHECK (end_minute > 0 AND end_minute <= 60),
    item_type TEXT NOT NULL, -- 'song', 'jingle', 'news', 'advertisement', 'playlist'
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
    track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    CONSTRAINT valid_minutes CHECK (start_minute < end_minute)
);

-- Clock Schedules (Weekly/Calendar assignment)
CREATE TABLE IF NOT EXISTS public.clock_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clock_id UUID REFERENCES public.clocks(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    specific_date DATE, -- Optional: for specific date overrides
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day_of_week, hour, specific_date)
);

-- RLS Policies
ALTER TABLE public.quick_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read quick_carts" ON public.quick_carts FOR SELECT USING (true);
CREATE POLICY "Admin full access quick_carts" ON public.quick_carts FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Public read clocks" ON public.clocks FOR SELECT USING (true);
CREATE POLICY "Admin full access clocks" ON public.clocks FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Public read clock_items" ON public.clock_items FOR SELECT USING (true);
CREATE POLICY "Admin full access clock_items" ON public.clock_items FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Public read clock_schedules" ON public.clock_schedules FOR SELECT USING (true);
CREATE POLICY "Admin full access clock_schedules" ON public.clock_schedules FOR ALL TO authenticated USING (is_admin(auth.uid()));
