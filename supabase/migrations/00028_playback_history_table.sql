CREATE TABLE IF NOT EXISTS playback_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    audio_url TEXT NOT NULL,
    type TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration FLOAT,
    metadata JSONB
);

-- Policy to allow anyone to read history
ALTER TABLE playback_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read playback history" ON playback_history FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert playback history" ON playback_history FOR INSERT TO anon WITH CHECK (true);
