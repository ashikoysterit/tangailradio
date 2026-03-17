-- Add last_time_announcement column to radio_session table
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS last_time_announcement TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_radio_session_last_time_announcement ON radio_session(last_time_announcement);

COMMENT ON COLUMN radio_session.last_time_announcement IS 'Timestamp of the last time announcement to prevent duplicate announcements';
