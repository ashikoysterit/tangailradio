-- Add interrupt and resume capability to radio_session
ALTER TABLE radio_session 
  ADD COLUMN IF NOT EXISTS interrupted_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interrupted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interrupt_offset NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interrupt_type TEXT;

COMMENT ON COLUMN radio_session.interrupted_track_id IS 'Track that was interrupted by priority content (adhan/news)';
COMMENT ON COLUMN radio_session.interrupted_at IS 'When the track was interrupted';
COMMENT ON COLUMN radio_session.interrupt_offset IS 'Playback position in seconds when interrupted';
COMMENT ON COLUMN radio_session.interrupt_type IS 'Type of interruption: adhan, news, program';
