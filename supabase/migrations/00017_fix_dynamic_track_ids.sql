-- Drop foreign key constraints
ALTER TABLE radio_session DROP CONSTRAINT IF EXISTS radio_session_current_track_id_fkey;
ALTER TABLE radio_session DROP CONSTRAINT IF EXISTS radio_session_interrupted_track_id_fkey;

-- Change column types to TEXT to allow non-UUID dynamic IDs
ALTER TABLE radio_session ALTER COLUMN current_track_id TYPE text;
ALTER TABLE radio_session ALTER COLUMN pending_content_id TYPE text;
ALTER TABLE radio_session ALTER COLUMN interrupted_track_id TYPE text;
