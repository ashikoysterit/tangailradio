-- Add audio file URLs for each prayer time (intro and adhan)
ALTER TABLE prayer_times 
  ADD COLUMN IF NOT EXISTS fajr_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS fajr_adhan_url TEXT,
  ADD COLUMN IF NOT EXISTS dhuhr_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS dhuhr_adhan_url TEXT,
  ADD COLUMN IF NOT EXISTS asr_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS asr_adhan_url TEXT,
  ADD COLUMN IF NOT EXISTS maghrib_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS maghrib_adhan_url TEXT,
  ADD COLUMN IF NOT EXISTS isha_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS isha_adhan_url TEXT,
  ADD COLUMN IF NOT EXISTS jummah_intro_url TEXT,
  ADD COLUMN IF NOT EXISTS jummah_adhan_url TEXT;

COMMENT ON COLUMN prayer_times.fajr_intro_url IS 'Intro audio URL for Fajr prayer';
COMMENT ON COLUMN prayer_times.fajr_adhan_url IS 'Adhan audio URL for Fajr prayer';
