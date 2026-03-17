-- Add fields to track pending content that needs intro
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_type TEXT;
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_id UUID;

COMMENT ON COLUMN radio_session.pending_content_type IS 'Type of content waiting for intro: adhan, news, program';
COMMENT ON COLUMN radio_session.pending_content_id IS 'ID of track waiting to play after intro';
