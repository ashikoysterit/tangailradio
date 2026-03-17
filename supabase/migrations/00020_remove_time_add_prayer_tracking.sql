ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS last_prayer_played TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS last_prayer_at TIMESTAMP WITH TIME ZONE;
-- No need to drop last_time_announcement for now, just ignore it.
