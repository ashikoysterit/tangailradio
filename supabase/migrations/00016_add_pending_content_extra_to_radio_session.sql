-- Add pending_content_extra column to radio_session for queuing multiple time announcement parts
ALTER TABLE radio_session ADD COLUMN IF NOT EXISTS pending_content_extra TEXT;

COMMENT ON COLUMN radio_session.pending_content_extra IS 'Extra pending content ID for chaining time announcements (e.g., period after minute)';
