ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_url TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_title TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_duration NUMERIC;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_type_extra TEXT;
