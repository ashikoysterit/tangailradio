-- Add intro_type field to tracks table for categorizing jingles
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS intro_type TEXT;

-- Add check constraint for valid intro types
ALTER TABLE tracks ADD CONSTRAINT intro_type_check 
  CHECK (intro_type IS NULL OR intro_type IN ('station_id', 'adhan_intro', 'news_intro', 'program_intro'));

-- Create index for faster intro lookup
CREATE INDEX IF NOT EXISTS idx_tracks_intro_type ON tracks(intro_type) WHERE intro_type IS NOT NULL;

COMMENT ON COLUMN tracks.intro_type IS 'Type of intro jingle: station_id (general), adhan_intro, news_intro, program_intro';
