-- Add advanced fields to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS bpm INTEGER;

-- Add advanced settings to station_settings
ALTER TABLE station_settings ADD COLUMN IF NOT EXISTS crossfade_duration INTEGER DEFAULT 5;
ALTER TABLE station_settings ADD COLUMN IF NOT EXISTS auto_trim_silence BOOLEAN DEFAULT true;
ALTER TABLE station_settings ADD COLUMN IF NOT EXISTS gapless_playback BOOLEAN DEFAULT true;
