ALTER TABLE station_settings ADD COLUMN IF NOT EXISTS default_playlist_id UUID REFERENCES playlists(id);
