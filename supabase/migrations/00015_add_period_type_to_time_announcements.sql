-- Update time_announcements table to support period type
ALTER TABLE time_announcements DROP CONSTRAINT IF EXISTS time_announcements_announcement_type_check;

ALTER TABLE time_announcements ADD CONSTRAINT time_announcements_announcement_type_check 
  CHECK (announcement_type IN ('hour', 'minute', 'period'));

COMMENT ON COLUMN time_announcements.announcement_type IS 'Type of announcement: hour (1-12), minute (15, 30, 45), or period (1=সকাল, 2=দুপুর, 3=বিকেল, 4=রাত)';
