-- Create time_announcements table for storing hour and minute audio files
CREATE TABLE IF NOT EXISTS time_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('hour', 'minute')),
  value INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_type, value)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_time_announcements_type_value ON time_announcements(announcement_type, value);

-- Add RLS policies
ALTER TABLE time_announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read time announcements" ON time_announcements
  FOR SELECT USING (true);

-- Allow authenticated users to manage
CREATE POLICY "Authenticated users can manage time announcements" ON time_announcements
  FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE time_announcements IS 'Stores audio files for time announcements (hours 1-12 and minutes 15, 30, 45)';
