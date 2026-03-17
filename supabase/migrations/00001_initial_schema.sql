-- Enable RLS
-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  email text,
  role public.user_role DEFAULT 'user'::public.user_role,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Helper for admin check
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- News table
CREATE TABLE public.news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notices table
CREATE TABLE public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Slider table
CREATE TABLE public.slider (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tracks table
CREATE TABLE public.tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  artist text,
  audio_url text NOT NULL,
  duration int, -- in seconds
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Playlists table
CREATE TABLE public.playlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('shuffle', 'sequential', 'timed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Playlist tracks junction table
CREATE TABLE public.playlist_tracks (
  playlist_id uuid REFERENCES public.playlists ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks ON DELETE CASCADE,
  position int NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

-- Station settings
CREATE TABLE public.station_settings (
  id int PRIMARY KEY DEFAULT 1,
  name text DEFAULT 'Tangail Radio',
  address text DEFAULT 'টাঙ্গাইল সদর থানা ১৯০০',
  chairman text DEFAULT 'মো: আশিক আহমেদ',
  mobile text DEFAULT '01303216921',
  email text DEFAULT 'ashik.oysterit@gmail.com',
  logo_url text,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- News
CREATE POLICY "News viewable by everyone" ON news FOR SELECT USING (true);
CREATE POLICY "Admins can manage news" ON news FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Notices
CREATE POLICY "Notices viewable by everyone" ON notices FOR SELECT USING (true);
CREATE POLICY "Admins can manage notices" ON notices FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Slider
CREATE POLICY "Slider viewable by everyone" ON slider FOR SELECT USING (true);
CREATE POLICY "Admins can manage slider" ON slider FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Tracks
CREATE POLICY "Tracks viewable by everyone" ON tracks FOR SELECT USING (true);
CREATE POLICY "Admins can manage tracks" ON tracks FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Playlists
CREATE POLICY "Playlists viewable by everyone" ON playlists FOR SELECT USING (true);
CREATE POLICY "Admins can manage playlists" ON playlists FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Playlist tracks
CREATE POLICY "Playlist tracks viewable by everyone" ON playlist_tracks FOR SELECT USING (true);
CREATE POLICY "Admins can manage playlist tracks" ON playlist_tracks FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Station settings
CREATE POLICY "Settings viewable by everyone" ON station_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON station_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tangail_radio_images', 'tangail_radio_images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('tangail_radio_audio', 'tangail_radio_audio', true);

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('tangail_radio_images', 'tangail_radio_audio'));
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('tangail_radio_images', 'tangail_radio_audio') AND is_admin(auth.uid()));
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('tangail_radio_images', 'tangail_radio_audio') AND is_admin(auth.uid()));
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('tangail_radio_images', 'tangail_radio_audio') AND is_admin(auth.uid()));

-- Insert initial settings
INSERT INTO public.station_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
