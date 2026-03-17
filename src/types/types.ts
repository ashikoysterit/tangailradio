export type UserRole = 'user' | 'admin';
export type AudioType = 'song' | 'jingle' | 'news' | 'adhan' | 'program' | 'advertisement' | 'voiceover' | 'external_stream';

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface News {
  id: string;
  content: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface SliderImage {
  id: string;
  image_url: string;
  title?: string;
  created_at: string;
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url: string;
  duration?: number;
  type?: AudioType;
  intro_type?: 'station_id' | 'adhan_intro' | 'news_intro' | 'program_intro';
  intro_url?: string; // Intro audio for this specific track
  scheduled_time?: string;
  last_played_at?: string;
  weight?: number;
  category?: string;
  bpm?: number;
  cue_in?: number;
  cue_out?: number;
  created_at: string;
}

export interface RadioSession {
  id: number;
  current_track_id: string | null;
  started_at: string;
  updated_at: string;
  pending_content_type?: string;
  pending_content_id?: string;
  interrupted_track_id?: string;
  interrupted_at?: string;
  interrupt_offset?: number;
  interrupt_type?: string;
  last_time_announcement?: string;
  pending_content_extra?: string;
  // Dynamic track data
  current_track_url?: string;
  current_track_title?: string;
  current_track_duration?: number;
  current_track_type?: string;
}

export interface PlaylistSchedule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  track_ids: string[];
  days_of_week: number[];
  active: boolean;
  created_at: string;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  type: 'shuffle' | 'sequential' | 'timed';
  created_at: string;
  tracks?: Track[];
}

export interface PlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
}

export interface StationSettings {
  id: number;
  name: string;
  address: string;
  chairman: string;
  mobile: string;
  email: string;
  logo_url?: string;
  playback_mode: 'shuffle' | 'sequential';
  crossfade_duration?: number;
  auto_trim_silence?: boolean;
  gapless_playback?: boolean;
  default_playlist_id?: string;
}

export interface PrayerTimes {
  id: number;
  fajr_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  jummah_time: string;
  fajr_intro_url?: string;
  fajr_adhan_url?: string;
  dhuhr_intro_url?: string;
  dhuhr_adhan_url?: string;
  asr_intro_url?: string;
  asr_adhan_url?: string;
  maghrib_intro_url?: string;
  maghrib_adhan_url?: string;
  isha_intro_url?: string;
  isha_adhan_url?: string;
  jummah_intro_url?: string;
  jummah_adhan_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeAnnouncement {
  id: string;
  announcement_type: 'hour' | 'minute' | 'period';
  value: number;
  audio_url: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  host_name?: string;
  schedule_time?: string;
  days_of_week: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  name: string;
  email?: string;
  comment: string;
  approved: boolean;
  created_at: string;
}

export interface ExternalStream {
  id: string;
  name: string;
  stream_url: string;
  schedule_time?: string;
  end_time?: string;
  days_of_week: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListenerSession {
  id: string;
  session_id: string;
  started_at: string;
  last_ping: string;
  user_agent?: string;
  ip_address?: string;
}

export interface DashboardStats {
  total_tracks: number;
  total_songs: number;
  total_programs: number;
  total_news: number;
  total_adhan: number;
  total_jingles: number;
  total_voiceovers: number;
  total_listeners: number;
  online_listeners: number;
}

export interface QuickCart {
  id: string;
  name: string;
  audio_url: string;
  color?: string;
  position?: number;
  created_at: string;
}

export interface Clock {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ClockItem {
  id: string;
  clock_id: string;
  start_minute: number;
  end_minute: number;
  item_type: AudioType | 'playlist';
  playlist_id?: string;
  track_id?: string;
}

export interface ClockSchedule {
  id: string;
  clock_id: string;
  day_of_week: number;
  hour: number;
  specific_date?: string;
  active: boolean;
  created_at: string;
}

export interface AdvertisementSchedule {
  id: string;
  name: string;
  track_id: string;
  type: 'time' | 'interval' | 'program';
  start_time?: string;
  end_time?: string;
  interval_minutes?: number;
  program_id?: string;
  days_of_week: number[];
  active: boolean;
  last_played_at?: string;
  created_at: string;
  updated_at: string;
  track?: Track;
}


