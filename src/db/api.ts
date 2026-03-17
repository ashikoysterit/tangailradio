import { supabase } from './supabase';
import { 
  News, 
  Notice, 
  SliderImage, 
  Track, 
  Playlist, 
  StationSettings, 
  Profile, 
  RadioSession,
  QuickCart,
  Clock,
  ClockItem,
  ClockSchedule,
  AdvertisementSchedule
} from '../types/types';

// News
export const fetchNews = async () => {
  const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as News[];
};

export const createNews = async (content: string) => {
  const { data, error } = await supabase.from('news').insert({ content }).select().single();
  if (error) throw error;
  return data as News;
};

export const deleteNews = async (id: string) => {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
};

// Notices
export const fetchNotices = async () => {
  const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Notice[];
};

export const createNotice = async (title: string, content: string) => {
  const { data, error } = await supabase.from('notices').insert({ title, content }).select().single();
  if (error) throw error;
  return data as Notice;
};

export const deleteNotice = async (id: string) => {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw error;
};

// Slider
export const fetchSlider = async () => {
  const { data, error } = await supabase.from('slider').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as SliderImage[];
};

export const createSliderImage = async (image_url: string, title?: string) => {
  const { data, error } = await supabase.from('slider').insert({ image_url, title }).select().single();
  if (error) throw error;
  return data as SliderImage;
};

export const deleteSliderImage = async (id: string) => {
  const { error } = await supabase.from('slider').delete().eq('id', id);
  if (error) throw error;
};

// Tracks
export const fetchTracks = async (type?: string) => {
  let query = supabase.from('tracks').select('*').order('created_at', { ascending: false });
  if (type) {
    query = query.eq('type', type);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Track[];
};

export const createTrack = async (track: Partial<Track>) => {
  const { data, error } = await supabase.from('tracks').insert(track).select().single();
  if (error) throw error;
  return data as Track;
};

export const deleteTrack = async (id: string) => {
  const { error } = await supabase.from('tracks').delete().eq('id', id);
  if (error) throw error;
};

export const updateTrack = async (id: string, updates: Partial<{
  title: string;
  artist: string;
  audio_url: string;
  duration: number;
  type: string;
  intro_type: string;
  scheduled_time: string;
  weight: number;
  category: string;
  bpm: number;
  cue_in: number;
  cue_out: number;
}>) => {
  const { error } = await supabase.from('tracks').update(updates).eq('id', id);
  if (error) throw error;
};

// Radio Session Management
export const getRadioSession = async (): Promise<RadioSession & { track: Track | null }> => {
  const { data, error } = await supabase
    .from('radio_session')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  
  const session = data as any;
  
  // If we have dynamic info, reconstruct the track object
  if (session.current_track_url) {
    session.track = {
      id: session.current_track_id,
      title: session.current_track_title || 'Untitled Dynamic Track',
      audio_url: session.current_track_url,
      duration: session.current_track_duration ? Number(session.current_track_duration) : undefined,
      type: session.current_track_type || 'jingle',
      created_at: session.updated_at
    } as Track;
  } else if (session.current_track_id) {
    // If it's a UUID, fetch it manually
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.current_track_id);
    if (isUUID) {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', session.current_track_id)
        .maybeSingle();
      session.track = trackData as Track;
    }
  }
  
  return session;
};

export const updateRadioSession = async (track: Track, started_at: Date): Promise<void> => {
  // Check current session first to avoid redundant updates from multiple clients
  const { data: current } = await supabase.from('radio_session').select('*').eq('id', 1).single();
  
  if (current) {
    const sessionStartedAt = new Date(current.started_at);
    const now = new Date();
    // If someone else already updated it in the last 5 seconds, AND it's the same track AND the info is already there, skip
    const isSameTrack = current.current_track_id === track.id;
    const hasFullInfo = current.current_track_url === track.audio_url;
    
    if (isSameTrack && hasFullInfo && (now.getTime() - sessionStartedAt.getTime() < 5000)) {
       return;
    }
  }

  const { error } = await supabase
    .from('radio_session')
    .update({ 
      current_track_id: track.id, 
      started_at: started_at.toISOString(),
      updated_at: new Date().toISOString(),
      interrupted_track_id: null,
      interrupt_offset: null,
      interrupt_type: null,
      current_track_url: track.audio_url,
      current_track_title: track.title,
      current_track_duration: track.duration,
      current_track_type: track.type
    })
    .eq('id', 1);
  if (error) throw error;

  // Log to playback history
  await supabase.from('playback_history').insert({
    track_id: track.id,
    title: track.title,
    artist: track.artist,
    audio_url: track.audio_url,
    type: track.type,
    started_at: started_at.toISOString(),
    duration: track.duration
  });
};

// Playback History API
export const fetchPlaybackHistory = async (limit = 20) => {
  const { data, error } = await supabase
    .from('playback_history')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// Playlist Schedule API
export const fetchPlaylistSchedules = async () => {
  const { data, error } = await supabase.from('playlist_schedules').select('*').order('start_time');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createPlaylistSchedule = async (schedule: {
  name: string;
  start_time: string;
  end_time: string;
  track_ids: string[];
  days_of_week: number[];
  active: boolean;
}) => {
  const { error } = await supabase.from('playlist_schedules').insert(schedule);
  if (error) throw error;
};

export const updatePlaylistSchedule = async (id: string, updates: Partial<{
  name: string;
  start_time: string;
  end_time: string;
  track_ids: string[];
  days_of_week: number[];
  active: boolean;
}>) => {
  const { error } = await supabase.from('playlist_schedules').update(updates).eq('id', id);
  if (error) throw error;
};

export const deletePlaylistSchedule = async (id: string) => {
  const { error } = await supabase.from('playlist_schedules').delete().eq('id', id);
  if (error) throw error;
};

// Prayer Times API
export const fetchPrayerTimes = async () => {
  const { data, error } = await supabase.from('prayer_times').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data;
};

export const updatePrayerTimes = async (updates: Partial<{
  fajr_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  jummah_time: string;
  active: boolean;
}>) => {
  const { error } = await supabase.from('prayer_times').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw error;
};

// Time Announcements
export const fetchTimeAnnouncements = async () => {
  const { data, error } = await supabase
    .from('time_announcements')
    .select('*')
    .eq('announcement_type', 'hour')
    .order('value');
  if (error) throw error;
  // Transform data to match expected format
  return (data || []).map(item => ({
    hour: item.value,
    audio_url: item.audio_url,
    id: item.id,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};

export const updateTimeAnnouncement = async (hour: number, audio_url: string) => {
  const { data, error } = await supabase
    .from('time_announcements')
    .upsert(
      { 
        announcement_type: 'hour',
        value: hour,
        audio_url,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'announcement_type,value' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Programs API
export const fetchPrograms = async () => {
  const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createProgram = async (program: {
  title: string;
  description?: string;
  image_url?: string;
  host_name?: string;
  schedule_time?: string;
  days_of_week: number[];
  active: boolean;
}) => {
  const { error } = await supabase.from('programs').insert(program);
  if (error) throw error;
};

export const updateProgram = async (id: string, updates: Partial<{
  title: string;
  description?: string;
  image_url?: string;
  host_name?: string;
  schedule_time?: string;
  days_of_week: number[];
  active: boolean;
}>) => {
  const { error } = await supabase.from('programs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
};

export const deleteProgram = async (id: string) => {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw error;
};

// Comments API
export const fetchComments = async (approvedOnly = false) => {
  let query = supabase.from('comments').select('*').order('created_at', { ascending: false });
  if (approvedOnly) {
    query = query.eq('approved', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createComment = async (comment: {
  name: string;
  email?: string;
  comment: string;
}) => {
  const { error } = await supabase.from('comments').insert(comment);
  if (error) throw error;
};

export const approveComment = async (id: string) => {
  const { error } = await supabase.from('comments').update({ approved: true }).eq('id', id);
  if (error) throw error;
};

export const deleteComment = async (id: string) => {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
};

// External Streams API
export const fetchExternalStreams = async () => {
  const { data, error } = await supabase.from('external_streams').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createExternalStream = async (stream: {
  name: string;
  stream_url: string;
  schedule_time?: string;
  end_time?: string;
  days_of_week: number[];
  active: boolean;
}) => {
  const { error } = await supabase.from('external_streams').insert(stream);
  if (error) throw error;
};

export const updateExternalStream = async (id: string, updates: Partial<{
  name: string;
  stream_url: string;
  schedule_time?: string;
  end_time?: string;
  days_of_week: number[];
  active: boolean;
}>) => {
  const { error } = await supabase.from('external_streams').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
};

export const deleteExternalStream = async (id: string) => {
  const { error } = await supabase.from('external_streams').delete().eq('id', id);
  if (error) throw error;
};

export const forcePlayExternalStream = async (stream: { id: string; name: string; stream_url: string }) => {
  const now = new Date();
  
  // Update session to play this stream immediately
  const { error } = await supabase
    .from('radio_session')
    .update({ 
      current_track_id: stream.id, 
      started_at: now.toISOString(),
      updated_at: now.toISOString(),
      current_track_url: stream.stream_url,
      current_track_title: stream.name,
      current_track_duration: '86400', // ১ দিন পর্যন্ত (যাতে অটো-রোটেশন না হয়)
      current_track_type: 'external_stream',
      interrupted_track_id: null, // Clear any interruptions
      interrupt_offset: null,
      interrupt_type: null
    })
    .eq('id', 1);
    
  if (error) throw error;
  
  // Log to history
  await supabase.from('playback_history').insert({
    track_id: stream.id,
    title: stream.name,
    artist: 'বাহ্যিক স্ট্রিম',
    audio_url: stream.stream_url,
    type: 'external_stream',
    started_at: now.toISOString()
  });
};

export const stopExternalStream = async () => {
  // Logic to stop the current stream and pick next regular track
  const nextTrack = await pickNextLiveTrack();
  if (nextTrack) {
    await updateRadioSession(nextTrack, new Date());
  }
};


// Advertisements API
export const fetchAdvertisementSchedules = async () => {
  const { data, error } = await supabase
    .from('advertisement_schedules')
    .select('*, track:tracks(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as AdvertisementSchedule[];
};

export const createAdvertisementSchedule = async (schedule: Partial<AdvertisementSchedule>) => {
  const { data, error } = await supabase.from('advertisement_schedules').insert(schedule).select().single();
  if (error) throw error;
  return data as AdvertisementSchedule;
};

export const updateAdvertisementSchedule = async (id: string, updates: Partial<AdvertisementSchedule>) => {
  const { error } = await supabase.from('advertisement_schedules').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
};

export const deleteAdvertisementSchedule = async (id: string) => {
  const { error } = await supabase.from('advertisement_schedules').delete().eq('id', id);
  if (error) throw error;
};


// Dashboard Statistics API
export const fetchDashboardStats = async () => {
  // Get track counts by type
  const { data: tracks } = await supabase.from('tracks').select('type');
  
  const stats = {
    total_tracks: tracks?.length || 0,
    total_songs: tracks?.filter(t => t.type === 'song').length || 0,
    total_programs: tracks?.filter(t => t.type === 'program').length || 0,
    total_news: tracks?.filter(t => t.type === 'news').length || 0,
    total_adhan: tracks?.filter(t => t.type === 'adhan').length || 0,
    total_jingles: tracks?.filter(t => t.type === 'jingle').length || 0,
    total_voiceovers: tracks?.filter(t => t.type === 'voiceover').length || 0,
    total_listeners: 0,
    online_listeners: 0
  };

  // Get listener counts
  const { count: totalListeners } = await supabase
    .from('listener_sessions')
    .select('*', { count: 'exact', head: true });
  
  // Online listeners are those who pinged in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: onlineListeners } = await supabase
    .from('listener_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('last_ping', fiveMinutesAgo);

  stats.total_listeners = totalListeners || 0;
  stats.online_listeners = onlineListeners || 0;

  return stats;
};

// Listener tracking
export const trackListener = async (sessionId: string) => {
  const { error } = await supabase
    .from('listener_sessions')
    .upsert({ 
      session_id: sessionId, 
      last_ping: new Date().toISOString(),
      user_agent: navigator.userAgent
    }, { 
      onConflict: 'session_id' 
    });
  if (error) console.error('Listener tracking error:', error);
};

// Next Track Picker Logic with Interrupt/Resume System
export const pickNextLiveTrack = async (currentOffset?: number): Promise<Track | null> => {
  const now = new Date();
  
  // Get Bangladesh hour, minute and day robustly
  const bdOptions = { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false } as const;
  const currentTimeStr = new Intl.DateTimeFormat('en-GB', bdOptions).format(now);
  const [currentHour, currentMinute] = currentTimeStr.split(':').map(Number);
  
  const dayOptions = { timeZone: 'Asia/Dhaka', weekday: 'short' } as const;
  const bdDayStr = new Intl.DateTimeFormat('en-US', dayOptions).format(now);
  const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const dayOfWeek = dayMap[bdDayStr] ?? now.getDay();

  const dateKey = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // YYYY-MM-DD
  const currentTotal = currentHour * 60 + currentMinute;
  
  // Get current session state
  const { data: session } = await supabase
    .from('radio_session')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  // Helper: Create dynamic track from prayer/time announcement audio
  const createPrayerTrack = (audioUrl: string, title: string, type: 'intro' | 'adhan'): Track => {
    return {
      id: `prayer_${type}_${dateKey}_${currentHour}`,
      title,
      audio_url: audioUrl,
      type: 'adhan',
      created_at: new Date().toISOString(),
      duration: 300 // ৫ মিনিটের ডিফল্ট ডিউরেশন (আযান এবং ইন্ট্রোর জন্য)
    } as Track;
  };

  // Helper: Save current track state before interruption
  const saveInterruptState = async (currentTrackId: string, offset: number, interruptType: string) => {
    await supabase.from('radio_session').update({
      interrupted_track_id: currentTrackId,
      interrupted_at: now.toISOString(),
      interrupt_offset: offset,
      interrupt_type: interruptType
    }).eq('id', 1);
  };



  // NEW: Check for Clock-based scheduling (Highest recurring priority)
  const currentMinuteForClock = currentMinute;

  // STEP 0.5: Check for Advertisements (Scheduled Time and Interval)
  const { data: activeAds } = await supabase
    .from('advertisement_schedules')
    .select('*, track:tracks(*)')
    .eq('active', true);

  if (activeAds && activeAds.length > 0) {
    for (const ad of activeAds) {
      if (!ad.days_of_week?.includes(dayOfWeek)) continue;
      if (!ad.track) continue;

      const lastPlayed = ad.last_played_at ? new Date(ad.last_played_at) : null;
      
      // Type: Time - Play at specific time
      if (ad.type === 'time' && ad.start_time) {
        const [ah, am] = ad.start_time.split(':').map(Number);
        const adTotal = ah * 60 + am;
        
        // Play within 2 minutes of target time, only if not played in the last hour
        const isTimeMatch = currentTotal >= adTotal && currentTotal < adTotal + 2;
        const wasPlayedRecently = lastPlayed && (now.getTime() - lastPlayed.getTime() < 3600000);
        
        if (isTimeMatch && !wasPlayedRecently) {
          console.log(`📢 Scheduled Ad Triggered: ${ad.name}`);
          await supabase.from('advertisement_schedules').update({ last_played_at: now.toISOString() }).eq('id', ad.id);
          
          if (session?.current_track_id && !session?.interrupted_track_id) {
            await saveInterruptState(session.current_track_id, currentOffset || 0, 'advertisement');
          }
          return ad.track as Track;
        }
      }
      
      // Type: Interval - Play every X minutes
      if (ad.type === 'interval' && ad.interval_minutes) {
        const intervalMs = ad.interval_minutes * 60000;
        const shouldPlay = !lastPlayed || (now.getTime() - lastPlayed.getTime() >= intervalMs);
        
        if (shouldPlay) {
          console.log(`📢 Interval Ad Triggered: ${ad.name}`);
          await supabase.from('advertisement_schedules').update({ last_played_at: now.toISOString() }).eq('id', ad.id);
          
          // Interval ads don't usually interrupt, they play between songs. 
          // But if we want it to be "advanced", maybe it should just return the track here.
          // Since this function is called when a track ends, it will naturally play next.
          return ad.track as Track;
        }
      }

      // Type: Program - Play during a program
      if (ad.type === 'program' && ad.program_id) {
        // Fetch current program
        const { data: program } = await supabase.from('programs').select('*').eq('id', ad.program_id).maybeSingle();
        if (program && program.active && program.days_of_week?.includes(dayOfWeek) && program.schedule_time) {
          const [ph, pm] = program.schedule_time.split(':').map(Number);
          const programStartTotal = ph * 60 + pm;
          // Assume program lasts 1 hour if not specified
          const programEndTotal = programStartTotal + 60; 
          
          if (currentTotal >= programStartTotal && currentTotal < programEndTotal) {
            // Within program window - play if last played > 15 mins ago
            const wasPlayedRecently = lastPlayed && (now.getTime() - lastPlayed.getTime() < 900000);
            if (!wasPlayedRecently) {
              console.log(`📢 Program Ad Triggered: ${ad.name} for program ${program.title}`);
              await supabase.from('advertisement_schedules').update({ last_played_at: now.toISOString() }).eq('id', ad.id);
              return ad.track as Track;
            }
          }
        }
      }
    }
  }

  const dateStrForClock = dateKey;

  // 1. Try to find a clock for this exact hour
  const { data: activeClockSchedule } = await supabase
    .from('clock_schedules')
    .select('*, clocks(*, clock_items(*))')
    .or(`specific_date.eq.${dateStrForClock},and(day_of_week.eq.${dayOfWeek},specific_date.is.null)`)
    .eq('hour', currentHour)
    .eq('active', true)
    .order('specific_date', { ascending: false, nullsFirst: false }) // Prioritize specific date
    .limit(1)
    .maybeSingle();

  if (activeClockSchedule?.clocks) {
    const clock = activeClockSchedule.clocks as any;
    const clockItems = clock.clock_items as any[];
    
    // Find the item corresponding to current minute
    const currentClockItem = clockItems.find(item => 
      currentMinuteForClock >= item.start_minute && currentMinuteForClock < item.end_minute
    );

    if (currentClockItem) {
      console.log(`🕒 Clock-based content triggered: ${clock.name} -> ${currentClockItem.item_type}`);
      
      if (currentClockItem.item_type === 'playlist' && currentClockItem.playlist_id) {
        // Pick a song from the specific playlist
        const { data: playlistTracks } = await supabase
          .from('playlist_tracks')
          .select('*, tracks(*)')
          .eq('playlist_id', currentClockItem.playlist_id);
          
        if (playlistTracks && playlistTracks.length > 0) {
          const randomIndex = Math.floor(Math.random() * playlistTracks.length);
          const track = (playlistTracks[randomIndex] as any).tracks as Track;
          if (track) {
            await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', track.id);
            return track;
          }
        }
      } else if (currentClockItem.track_id) {
        const { data: track } = await supabase.from('tracks').select('*').eq('id', currentClockItem.track_id).maybeSingle();
        if (track) {
          await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', track.id);
          return track as Track;
        }
      } else {
        // Pick a random track of the specified type
        const { data: tracks } = await supabase
          .from('tracks')
          .select('*')
          .eq('type', currentClockItem.item_type)
          .order('last_played_at', { ascending: true, nullsFirst: true })
          .limit(10);
          
        if (tracks && tracks.length > 0) {
          const track = tracks[Math.floor(Math.random() * tracks.length)];
          await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', track.id);
          return track as Track;
        }
      }
    }
  }

  // STEP 0: Check for Hourly Time Announcement
  // Create a unique key for this hour's announcement (e.g. "2026-03-15_14")
  const hourKey = `${dateKey}_${currentHour}`;

  if (currentMinute === 0) {
    // Re-fetch session to get the latest last_time_announcement value
    const { data: freshSession } = await supabase.from('radio_session').select('*').eq('id', 1).maybeSingle();
    
    if (freshSession?.last_time_announcement !== hourKey) {
      // Check if we have an audio for this hour
      const { data: timeAudio } = await supabase
        .from('time_announcements')
        .select('*')
        .eq('announcement_type', 'hour')
        .eq('value', currentHour)
        .maybeSingle();

      if (timeAudio && timeAudio.audio_url) {
        console.log(`⏰ সময় এনাউন্সমেন্ট শুরু হচ্ছে: ${currentHour}:০০`);
        
        // Update session to mark this hour as played
        await supabase.from('radio_session').update({
          last_time_announcement: hourKey
        }).eq('id', 1);

        // INTERRUPT current playback if needed
        if (session?.current_track_id && !session?.interrupted_track_id) {
          await saveInterruptState(session.current_track_id, currentOffset || 0, 'time_announcement');
        }

        // Create the time announcement track - stable ID for sync
        const timeTrack = {
          id: `time_${currentHour}_${dateKey}`,
          title: `${currentHour < 10 ? '০' : ''}${currentHour}:০০ সময় এনাউন্সমেন্ট`,
          audio_url: timeAudio.audio_url,
          type: 'jingle',
          created_at: new Date().toISOString(),
          duration: 60 // ১ মিনিটের ডিফল্ট ডিউরেশন (সময় এনাউন্সমেন্টের জন্য)
        } as Track;

        // Check if there is a prayer time at this exact same time
        // We will handle the Adhan as "pending content" to be played after this time track
        const { data: prayerTimes } = await supabase.from('prayer_times').select('*').eq('id', 1).eq('active', true).maybeSingle();
        if (prayerTimes) {
          const checkTimeMatch = (targetTime: string) => {
            if (!targetTime) return false;
            const [tH, tM] = targetTime.split(':').map(Number);
            return tH === currentHour && tM === 0;
          };

          let prayerKey: string | null = null;
          if (dayOfWeek === 5) {
            if (checkTimeMatch(prayerTimes.fajr_time)) prayerKey = 'fajr';
            else if (checkTimeMatch(prayerTimes.asr_time)) prayerKey = 'asr';
            else if (checkTimeMatch(prayerTimes.maghrib_time)) prayerKey = 'maghrib';
            else if (checkTimeMatch(prayerTimes.isha_time)) prayerKey = 'isha';
            else if (checkTimeMatch(prayerTimes.jummah_time)) prayerKey = 'jummah';
          } else {
            if (checkTimeMatch(prayerTimes.fajr_time)) prayerKey = 'fajr';
            else if (checkTimeMatch(prayerTimes.dhuhr_time)) prayerKey = 'dhuhr';
            else if (checkTimeMatch(prayerTimes.asr_time)) prayerKey = 'asr';
            else if (checkTimeMatch(prayerTimes.maghrib_time)) prayerKey = 'maghrib';
            else if (checkTimeMatch(prayerTimes.isha_time)) prayerKey = 'isha';
          }

          if (prayerKey) {
             const prayerDayKey = `${prayerKey}_${dateKey}`;
             
             const introUrl = prayerTimes[`${prayerKey}_intro_url` as keyof typeof prayerTimes] as string | undefined;
             const adhanUrl = prayerTimes[`${prayerKey}_adhan_url` as keyof typeof prayerTimes] as string | undefined;
             
             if (introUrl || adhanUrl) {
               console.log(`📋 সময় এনাউন্সমেন্টের পর আযান প্রচারের জন্য শিডিউল করা হলো: ${prayerKey}`);
               
               // Mark prayer as played now so STEP 3 doesn't double-trigger
               await supabase.from('radio_session').update({
                  last_prayer_played: prayerDayKey,
                  last_prayer_at: now.toISOString()
               }).eq('id', 1);

               // Set the first part of prayer (intro or adhan) as pending
               const nextContent = introUrl || adhanUrl;
               const nextTitle = introUrl ? `${prayerKey} ইন্ট্রো` : `${prayerKey} আযান`;
               const nextType = introUrl ? 'intro' : 'adhan';

               await supabase.from('radio_session').update({
                  pending_content_type: nextType,
                  pending_content_id: `pending_${prayerKey}_${dateKey}`,
                  pending_content_url: nextContent,
                  pending_content_title: nextTitle,
                  pending_content_duration: 300, // ৫ মিনিটের ডিফল্ট ডিউরেশন (আযান এবং ইন্ট্রোর জন্য)
                  pending_content_extra: introUrl ? adhanUrl : null // Store adhan if we just played intro
               }).eq('id', 1);
             }
          }
        }

        return timeTrack;
      }
    }
  }

  // STEP 1: Check if we need to resume an interrupted track
  if (session?.interrupted_track_id && !session?.pending_content_id) {
    const { data: interruptedTrack } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', session.interrupted_track_id)
      .maybeSingle();

    if (interruptedTrack) {
      // Clear interrupt state
      await supabase.from('radio_session').update({
        interrupted_track_id: null,
        interrupted_at: null,
        interrupt_offset: null,
        interrupt_type: null
      }).eq('id', 1);
      
      // Return the interrupted track (client should resume from interrupt_offset)
      return { ...interruptedTrack, resume_from: session.interrupt_offset || 0 } as any;
    }
  }

  // STEP 2: Check if there's pending content waiting after intro
  if (session?.pending_content_id && session?.pending_content_type) {
    let pendingTrack: Track | null = null;
    
    // Check if it's a UUID (should exist in tracks table)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.pending_content_id);
    
    if (isUUID) {
      const { data } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', session.pending_content_id)
        .maybeSingle();
      pendingTrack = data as Track;
    } else if (session.pending_content_url) {
      // It's a dynamic pending track
      pendingTrack = {
        id: session.pending_content_id,
        title: session.pending_content_title || 'Untitled Pending Track',
        audio_url: session.pending_content_url,
        duration: session.pending_content_duration ? Number(session.pending_content_duration) : undefined,
        type: 'jingle',
        created_at: session.updated_at
      } as Track;
    }

    if (pendingTrack) {
      // If this was an intro, check if we have a real adhan content waiting in pending_content_extra
      if (session.pending_content_type === 'intro' && session.pending_content_extra) {
         // Update session: current intro is cleared, adhan becomes the NEW pending content
         await supabase.from('radio_session').update({
            pending_content_type: 'adhan',
            pending_content_id: `adhan_${Date.now()}`,
            pending_content_url: session.pending_content_extra,
            pending_content_title: 'আযান',
            pending_content_duration: 300,
            pending_content_extra: null
         }).eq('id', 1);
      } else {
        // Clear pending content entirely
        await supabase.from('radio_session').update({ 
          pending_content_type: null, 
          pending_content_id: null,
          pending_content_url: null,
          pending_content_title: null,
          pending_content_duration: null,
          pending_content_extra: null
        }).eq('id', 1);
      }
      
      if (isUUID) {
        await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', pendingTrack.id);
      }
      return pendingTrack;
    }
  }

  
  // STEP 3: Check for Prayer Times (HIGHEST PRIORITY - INTERRUPTS EVERYTHING)
  const { data: prayerTimes } = await supabase
    .from('prayer_times')
    .select('*')
    .eq('id', 1)
    .eq('active', true)
    .maybeSingle();

  if (prayerTimes) {
    let prayerKey: string | null = null;
    
    // New logic for prayerKey detection with 3-minute window
    const checkTimeMatch = (targetTime: string) => {
      if (!targetTime) return false;
      const [targetH, targetM] = targetTime.split(':').map(Number);
      const currentH = currentHour;
      const currentM = currentMinute;
      
      const targetTotal = targetH * 60 + targetM;
      const currentTotal = currentH * 60 + currentM;
      
      // Return true if we are within 0-2 minutes of the target time
      return currentTotal >= targetTotal && currentTotal < targetTotal + 3;
    };

    if (dayOfWeek === 5) {
      // Friday - check Fajr, Asr, Maghrib, Isha, Jummah (not Dhuhr)
      if (checkTimeMatch(prayerTimes.fajr_time)) prayerKey = 'fajr';
      else if (checkTimeMatch(prayerTimes.asr_time)) prayerKey = 'asr';
      else if (checkTimeMatch(prayerTimes.maghrib_time)) prayerKey = 'maghrib';
      else if (checkTimeMatch(prayerTimes.isha_time)) prayerKey = 'isha';
      else if (checkTimeMatch(prayerTimes.jummah_time)) prayerKey = 'jummah';
    } else {
      // Other days - check all 5 prayers (not Jummah)
      if (checkTimeMatch(prayerTimes.fajr_time)) prayerKey = 'fajr';
      else if (checkTimeMatch(prayerTimes.dhuhr_time)) prayerKey = 'dhuhr';
      else if (checkTimeMatch(prayerTimes.asr_time)) prayerKey = 'asr';
      else if (checkTimeMatch(prayerTimes.maghrib_time)) prayerKey = 'maghrib';
      else if (checkTimeMatch(prayerTimes.isha_time)) prayerKey = 'isha';
    }

    if (prayerKey) {
      const introUrl = prayerTimes[`${prayerKey}_intro_url` as keyof typeof prayerTimes] as string | undefined;
      const adhanUrl = prayerTimes[`${prayerKey}_adhan_url` as keyof typeof prayerTimes] as string | undefined;

      // Check if we already played this specific prayer today
      const prayerDayKey = `${prayerKey}_${dateKey}`;
      
      const shouldPlay = session?.last_prayer_played !== prayerDayKey;

      if (shouldPlay) {
        console.log(`✅ আযান প্রচার শুরু হচ্ছে: ${prayerKey}`);
        
        // Update session to mark this prayer as played
        await supabase.from('radio_session').update({
          last_prayer_played: prayerDayKey,
          last_prayer_at: now.toISOString()
        }).eq('id', 1);

        // INTERRUPT current playback if needed
        if (session?.current_track_id && !session?.interrupted_track_id) {
          await saveInterruptState(session.current_track_id, currentOffset || 0, 'adhan');
        }

        // Play intro first if available
        if (introUrl) {
          console.log(`🎵 ইন্ট্রো প্রচার করা হচ্ছে: ${prayerKey}`);
          const introTrack = createPrayerTrack(introUrl, `${prayerKey} ইন্ট্রো`, 'intro');
          
          // Set adhan as pending
          if (adhanUrl) {
            const adhanTrack = createPrayerTrack(adhanUrl, `${prayerKey} আযান`, 'adhan');
            await supabase.from('radio_session').update({
              pending_content_type: 'adhan',
              pending_content_id: adhanTrack.id as any,
              pending_content_url: adhanTrack.audio_url,
              pending_content_title: adhanTrack.title,
              pending_content_duration: adhanTrack.duration
            }).eq('id', 1);
          }
          
          return introTrack;
        }
        
        // Play adhan directly if no intro
        if (adhanUrl) {
          return createPrayerTrack(adhanUrl, `${prayerKey} আযান`, 'adhan');
        }
      } else {
        // If we've already played it, check if we're still in the window
        // and if the current track is NOT an adhan.
        // If it's not an adhan, it might mean we missed the transition 
        // or something else replaced it. But for now, if it's already marked as played,
        // we should just let it be or continue with normal rotation if the adhan is likely finished.
        
        // Let's check if the current track is adhan
        if (session?.current_track_type === 'adhan') {
          console.log(`আযান ইতিমধ্যে বাজছে, নতুন করে শুরু করা হবে না`);
          return getRadioSession().then(s => s.track);
        }
      }
    }
  }

  // STEP 3.5: Check for External Streams (Scheduled)
  const { data: externalStreams } = await supabase
    .from('external_streams')
    .select('*')
    .eq('active', true);

  if (externalStreams && externalStreams.length > 0) {
    for (const stream of externalStreams) {
      if (!stream.schedule_time || !stream.end_time || !stream.active) continue;
      
      const day = dayOfWeek;
      if (!stream.days_of_week?.includes(day)) continue;

      const [sh, sm] = stream.schedule_time.split(':').map(Number);
      const [eh, em] = stream.end_time.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      
      const currentH = currentHour;
      const currentM = currentMinute;
      const currentTotalVal = currentH * 60 + currentM;
      
      if (currentTotalVal >= startTotal && currentTotalVal < endTotal) {
        console.log(`📡 বাহ্যিক স্ট্রিমিং শিডিউল পাওয়া গেছে: ${stream.name}`);
        
        // If it's already playing, return it to maintain state
        if (session?.current_track_id === stream.id && session?.current_track_type === 'external_stream') {
           return {
            id: stream.id,
            title: stream.name,
            audio_url: stream.stream_url,
            type: 'external_stream',
            duration: (endTotal - currentTotal) * 60
           } as Track;
        }

        // INTERRUPT current playback if it's NOT already playing the stream and not interrupted
        if (session?.current_track_id && !session?.interrupted_track_id) {
           await saveInterruptState(session.current_track_id, currentOffset || 0, 'external_stream');
        }

        return {
          id: stream.id,
          title: stream.name,
          audio_url: stream.stream_url,
          type: 'external_stream',
          created_at: stream.created_at,
          duration: (endTotal - currentTotal) * 60
        } as Track;
      }
    }
  }
  
  // STEP 4: Check for Scheduled News/Programs/Advertisements (HIGH PRIORITY - ALSO INTERRUPTS)
  // Look for any scheduled track that is due in the last 30 minutes but hasn't played yet
  const { data: scheduled } = await supabase
    .from('tracks')
    .select('*')
    .in('type', ['news', 'program', 'advertisement'])
    .not('scheduled_time', 'is', null)
    .order('last_played_at', { ascending: true, nullsFirst: true })
    .limit(10); // Check a few of them

  if (scheduled && scheduled.length > 0) {
    for (const track of scheduled) {
      if (!track.scheduled_time) continue;
      
      const [sh, sm] = track.scheduled_time.split(':').map(Number);
      const targetTotal = sh * 60 + sm;
      const currentH = currentHour;
      const currentM = currentMinute;
      const currentTotalVal = currentH * 60 + currentM;
      
      // If we are within the window (e.g., 0 to 30 minutes after scheduled time) 
      // AND it hasn't been played in the last hour
      const diff = currentTotalVal - targetTotal;
      const lastPlayed = track.last_played_at ? new Date(track.last_played_at) : null;
      const hourMs = 3600000;
      
      const shouldPlayNow = diff >= 0 && diff < 30 && (!lastPlayed || (now.getTime() - lastPlayed.getTime() > hourMs));
      
      if (shouldPlayNow) {
        console.log(`সিডিউল করা ট্র্যাক পাওয়া গেছে: ${track.title} (${track.scheduled_time})`);
        
        // INTERRUPT current playback if needed (for news, programs, and advertisements)
        if (session?.current_track_id && !session?.interrupted_track_id) {
          await saveInterruptState(session.current_track_id, currentOffset || 0, track.type);
        }

        // Check if track has its own intro_url
        // Advertisements don't need intros, play directly
        if (track.type === 'advertisement') {
          await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', track.id);
          return track;
        }

        if (track.intro_url) {
          // Play track's own intro first
          const introTrack = createPrayerTrack(track.intro_url, `${track.title} ইন্ট্রো`, 'intro');
          await supabase.from('radio_session').update({
            pending_content_type: track.type,
            pending_content_id: track.id
          }).eq('id', 1);
          return introTrack;
        }

        // Otherwise, try to find a generic intro based on type
        const introType = track.type === 'news' ? 'news_intro' : 'program_intro';
        const { data: intros } = await supabase
          .from('tracks')
          .select('*')
          .eq('type', 'jingle')
          .eq('intro_type', introType)
          .order('last_played_at', { ascending: true, nullsFirst: true })
          .limit(1);

        if (intros && intros.length > 0) {
          const intro = intros[0];
          await supabase.from('radio_session').update({
            pending_content_type: track.type,
            pending_content_id: track.id
          }).eq('id', 1);
          await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', intro.id);
          return intro;
        }

        // No intro, play directly
        await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', track.id);
        return track;
      }
    }
  }

  // STEP 5: Play Station ID between songs (30% chance)
  const chance = Math.random();
  if (chance < 0.3) {
    const { data: stationIds } = await supabase
      .from('tracks')
      .select('*')
      .eq('type', 'jingle')
      .eq('intro_type', 'station_id')
      .order('last_played_at', { ascending: true, nullsFirst: true })
      .limit(1);
      
    if (stationIds && stationIds.length > 0) {
      const stationId = stationIds[0];
      await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', stationId.id);
      return stationId;
    }
  }

  // STEP 5.5: Voice Tracking (20% chance before a song for live feel)
  const vtChance = Math.random();
  if (session?.current_track_type !== 'voiceover' && vtChance < 0.2) {
    const { data: voiceovers } = await supabase
      .from('tracks')
      .select('*')
      .eq('type', 'voiceover')
      .order('last_played_at', { ascending: true, nullsFirst: true })
      .limit(1);
      
    if (voiceovers && voiceovers.length > 0) {
      const vt = voiceovers[0];
      await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', vt.id);
      console.log(`🎙️ Voice Tracking সেগমেন্ট প্রচার করা হচ্ছে: ${vt.title}`);
      return vt;
    }
  }

  // STEP 6: Normal Songs (with Artist Separation and Time Fitting)
  // Check for Default Auto-DJ Playlist
  const { data: stS } = await supabase.from('station_settings').select('default_playlist_id').eq('id', 1).maybeSingle();
  
  const minutesUntilHour = 60 - currentMinute;
  
  // Find next scheduled event within this hour
  const { data: nextScheduled } = await supabase
    .from('tracks')
    .select('scheduled_time, type')
    .in('type', ['news', 'program', 'advertisement'])
    .not('scheduled_time', 'is', null)
    .order('scheduled_time', { ascending: true })
    .gte('scheduled_time', currentTimeStr)
    .limit(1);

  let minutesUntilNextEvent = minutesUntilHour;
  if (nextScheduled && nextScheduled.length > 0) {
    const [sh, sm] = nextScheduled[0].scheduled_time.split(':').map(Number);
    const eventTotal = sh * 60 + sm;
    const currentTotal = currentHour * 60 + currentMinute;
    const diff = eventTotal - currentTotal;
    if (diff > 0 && diff < minutesUntilNextEvent) {
      minutesUntilNextEvent = diff;
    }
  }

  // Get recently played artists to avoid repetition (Artist Separation)
  const { data: recentTracks } = await supabase
    .from('tracks')
    .select('artist')
    .not('artist', 'is', null)
    .order('last_played_at', { ascending: false })
    .limit(5);
  
  const recentArtists = (recentTracks || []).map(t => t.artist).filter(Boolean);

  let query = supabase
    .from('tracks')
    .select('*')
    .eq('type', 'song');

  // If a default Auto-DJ playlist is set, pick only from there
  if (stS?.default_playlist_id) {
    const { data: pTracks } = await supabase
      .from('playlist_tracks')
      .select('track_id')
      .eq('playlist_id', stS.default_playlist_id);
    
    if (pTracks && pTracks.length > 0) {
      query = query.in('id', pTracks.map(pt => pt.track_id));
    }
  }

  // If we are nearing an event, try to find a song that fits
  // If < 2 mins, we probably shouldn't start a full song
  if (minutesUntilNextEvent < 2) {
    console.log(`⏳ পরবর্তী অনুষ্ঠানের জন্য ২ মিনিটের কম সময় আছে (${minutesUntilNextEvent} মিনিট), একটি ছোট জিঙ্গেল খোঁজা হচ্ছে...`);
    const { data: shortJingles } = await supabase
      .from('tracks')
      .select('*')
      .eq('type', 'jingle')
      .order('last_played_at', { ascending: true, nullsFirst: true })
      .limit(5);
    
    if (shortJingles && shortJingles.length > 0) {
      const jingle = shortJingles[Math.floor(Math.random() * shortJingles.length)];
      await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', jingle.id);
      return jingle;
    }
  }

  // Normal song picking with artist separation and WEIGHTED randomization
  if (recentArtists.length > 0) {
    query = query.not('artist', 'in', `(${recentArtists.map(a => `"${a}"`).join(',')})`);
  }

  // Get a pool of 20 songs that haven't been played in a while
  const { data: songs } = await query
    .order('last_played_at', { ascending: true, nullsFirst: true })
    .limit(20);

  if (songs && songs.length > 0) {
    // Advanced: Weighted Randomization
    // Higher weight means more likely to be picked from the pool
    let selectedSong = songs[0];
    
    const totalWeight = songs.reduce((acc, s) => acc + (s.weight || 1), 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const song of songs) {
      randomWeight -= (song.weight || 1);
      if (randomWeight <= 0) {
        selectedSong = song;
        break;
      }
    }

    // If we have time constraints, try to pick a song that fits well (override if necessary)
    if (minutesUntilNextEvent < 6) {
       // Look for a song in the pool that's shorter than the remaining time
       const fittingSong = songs.find(s => (s.duration || 240) < (minutesUntilNextEvent * 60));
       if (fittingSong) selectedSong = fittingSong;
    }

    await supabase.from('tracks').update({ last_played_at: now.toISOString() }).eq('id', selectedSong.id);
    return selectedSong;
  }

  return null;
};

// Playlists
export const fetchPlaylists = async () => {
  const { data, error } = await supabase.from('playlists').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Playlist[];
};

export const fetchPlaylistWithTracks = async (playlistId: string) => {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_tracks (
        track_id,
        position,
        tracks (*)
      )
    `)
    .eq('id', playlistId)
    .single();

  if (error) throw error;
  
  const tracks = data.playlist_tracks
    .sort((a: any, b: any) => a.position - b.position)
    .map((pt: any) => pt.tracks);
    
  return { ...data, tracks } as Playlist;
};

export const createPlaylist = async (name: string, type: 'shuffle' | 'sequential' | 'timed' = 'shuffle') => {
  const { data, error } = await supabase.from('playlists').insert({ name, type }).select().single();
  if (error) throw error;
  return data as Playlist;
};

export const deletePlaylist = async (id: string) => {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) throw error;
};

export const addTrackToPlaylist = async (playlist_id: string, track_id: string, position: number) => {
  const { error } = await supabase.from('playlist_tracks').insert({ playlist_id, track_id, position });
  if (error) throw error;
};

export const removeTrackFromPlaylist = async (playlist_id: string, track_id: string) => {
  const { error } = await supabase.from('playlist_tracks').delete().eq('playlist_id', playlist_id).eq('track_id', track_id);
  if (error) throw error;
};

export const updatePlaylistTracks = async (playlist_id: string, track_ids: string[]) => {
  // Clear existing tracks
  const { error: deleteError } = await supabase.from('playlist_tracks').delete().eq('playlist_id', playlist_id);
  if (deleteError) throw deleteError;
  
  // Add new tracks in order
  if (track_ids.length > 0) {
    const tracksToInsert = track_ids.map((track_id, index) => ({
      playlist_id,
      track_id,
      position: index + 1
    }));
    const { error: insertError } = await supabase.from('playlist_tracks').insert(tracksToInsert);
    if (insertError) throw insertError;
  }
};
// Settings
export const fetchSettings = async () => {
  const { data, error } = await supabase.from('station_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data as StationSettings;
};

export const updateSettings = async (settings: Partial<StationSettings>) => {
  const { data, error } = await supabase.from('station_settings').update(settings).eq('id', 1).select().single();
  if (error) throw error;
  return data as StationSettings;
};

// Profiles

// QuickCarts API
export const fetchQuickCarts = async () => {
  const { data, error } = await supabase.from('quick_carts').select('*').order('position');
  if (error) throw error;
  return data as QuickCart[];
};

export const createQuickCart = async (cart: Partial<QuickCart>) => {
  const { data, error } = await supabase.from('quick_carts').insert(cart).select().single();
  if (error) throw error;
  return data as QuickCart;
};

export const deleteQuickCart = async (id: string) => {
  const { error } = await supabase.from('quick_carts').delete().eq('id', id);
  if (error) throw error;
};

// Clocks API
export const fetchClocks = async () => {
  const { data, error } = await supabase.from('clocks').select('*, clock_items(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return data as (Clock & { clock_items: ClockItem[] })[];
};

export const createClock = async (name: string, description?: string) => {
  const { data, error } = await supabase.from('clocks').insert({ name, description }).select().single();
  if (error) throw error;
  return data as Clock;
};

export const deleteClock = async (id: string) => {
  const { error } = await supabase.from('clocks').delete().eq('id', id);
  if (error) throw error;
};

export const fetchClockItems = async (clockId: string) => {
  const { data, error } = await supabase.from('clock_items').select('*').eq('clock_id', clockId).order('start_minute');
  if (error) throw error;
  return data as ClockItem[];
};

export const updateClockItems = async (clockId: string, items: Partial<ClockItem>[]) => {
  // Clear existing items
  const { error: deleteError } = await supabase.from('clock_items').delete().eq('clock_id', clockId);
  if (deleteError) throw deleteError;
  
  if (items.length > 0) {
    const { error: insertError } = await supabase.from('clock_items').insert(items.map(item => ({ ...item, clock_id: clockId })));
    if (insertError) throw insertError;
  }
};

// Clock Schedules API
export const fetchClockSchedules = async () => {
  const { data, error } = await supabase.from('clock_schedules').select('*, clocks(*)').order('hour').order('day_of_week');
  if (error) throw error;
  return data as (ClockSchedule & { clocks: Clock })[];
};

export const updateClockSchedule = async (clock_id: string | null, day_of_week: number, hour: number, specific_date?: string) => {
  if (clock_id) {
    const { error } = await supabase.from('clock_schedules').upsert({
      clock_id,
      day_of_week,
      hour,
      specific_date: specific_date || null,
      active: true
    }, { onConflict: 'day_of_week,hour,specific_date' });
    if (error) throw error;
  } else {
    // Remove schedule if clock_id is null
    let query = supabase.from('clock_schedules').delete().eq('day_of_week', day_of_week).eq('hour', hour);
    if (specific_date) {
      query = query.eq('specific_date', specific_date);
    } else {
      query = query.is('specific_date', null);
    }
    const { error } = await query;
    if (error) throw error;
  }
};

export const fetchProfile = async (uid: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error) throw error;
  return data as Profile;
};

