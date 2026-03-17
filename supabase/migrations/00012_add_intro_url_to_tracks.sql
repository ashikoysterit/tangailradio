-- Add intro_url field to tracks for news/programs to have their own intro
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS intro_url TEXT;

COMMENT ON COLUMN tracks.intro_url IS 'Intro audio URL for this specific track (used for news/programs)';

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_tracks_intro_url ON tracks(intro_url) WHERE intro_url IS NOT NULL;
