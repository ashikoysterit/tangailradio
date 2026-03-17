ALTER TABLE public.station_settings ADD COLUMN playback_mode text DEFAULT 'sequential' CHECK (playback_mode IN ('shuffle', 'sequential'));
