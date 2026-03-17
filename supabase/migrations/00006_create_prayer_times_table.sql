-- Create prayer times table for Adhan scheduling
CREATE TABLE IF NOT EXISTS prayer_times (
  id BIGSERIAL PRIMARY KEY,
  fajr_time TIME NOT NULL DEFAULT '05:00:00',
  dhuhr_time TIME NOT NULL DEFAULT '12:30:00',
  asr_time TIME NOT NULL DEFAULT '16:00:00',
  maghrib_time TIME NOT NULL DEFAULT '18:15:00',
  isha_time TIME NOT NULL DEFAULT '19:30:00',
  jummah_time TIME NOT NULL DEFAULT '13:00:00',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default prayer times
INSERT INTO prayer_times (id, fajr_time, dhuhr_time, asr_time, maghrib_time, isha_time, jummah_time, active)
VALUES (1, '05:00:00', '12:30:00', '16:00:00', '18:15:00', '19:30:00', '13:00:00', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;

-- Anyone can read prayer times
CREATE POLICY "Anyone can read prayer times"
  ON prayer_times FOR SELECT
  USING (true);

-- Only admins can update prayer times
CREATE POLICY "Admins can update prayer times"
  ON prayer_times FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );