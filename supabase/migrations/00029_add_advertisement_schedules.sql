CREATE TABLE advertisement_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('time', 'interval', 'program')),
    start_time TIME,
    end_time TIME,
    interval_minutes INTEGER,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    days_of_week INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
    active BOOLEAN DEFAULT true,
    last_played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add policy for advertisement_schedules
ALTER TABLE advertisement_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read advertisement_schedules" ON advertisement_schedules FOR SELECT USING (true);
CREATE POLICY "Admin full access advertisement_schedules" ON advertisement_schedules FOR ALL USING (true) WITH CHECK (true);
