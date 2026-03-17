ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS current_track_url TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS current_track_title TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS current_track_duration NUMERIC;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS current_track_type TEXT;
