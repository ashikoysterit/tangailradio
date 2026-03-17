import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Music, Waves, Radio, Mic, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Track } from '../types/types';
import { getRadioSession, updateRadioSession, pickNextLiveTrack, trackListener } from '@/db/api';
import { motion } from 'framer-motion';
import { supabase } from '@/db/supabase';

// Generate unique session ID for listener tracking
const getSessionId = () => {
  let sessionId = localStorage.getItem('radio_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('radio_session_id', sessionId);
  }
  return sessionId;
};

export const RadioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState([70]);
  const [liveOffset, setLiveOffset] = useState(0);
  const [isDucked, setIsDucked] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [externalStreamTimes, setExternalStreamTimes] = useState<{time: string, endTime: string, days: number[]}[]>([]);
  const prayerTimesRef = useRef<any>(null);
  const scheduledTimesRef = useRef<string[]>([]);
  const externalStreamTimesRef = useRef<{time: string, endTime: string, days: number[]}[]>([]);
  
  useEffect(() => {
    prayerTimesRef.current = prayerTimes;
  }, [prayerTimes]);
  
  useEffect(() => {
    scheduledTimesRef.current = scheduledTimes;
  }, [scheduledTimes]);

  useEffect(() => {
    externalStreamTimesRef.current = externalStreamTimes;
  }, [externalStreamTimes]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUpdatingRef = useRef(false);
  const sessionId = useRef(getSessionId());
  const lastTimeCheckRef = useRef<string>(''); // Track last check (format: "type_HH_MM")

  // Track listener activity
  const isPlayingRef = useRef(false);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const handleDucking = (e: any) => {
      setIsDucked(e.detail.active);
    };
    window.addEventListener('radio-ducking', handleDucking as any);
    return () => window.removeEventListener('radio-ducking', handleDucking as any);
  }, []);


  useEffect(() => {
    if (isPlaying) {
      // Initial ping
      trackListener(sessionId.current);
      
      // Ping every 2 minutes while playing
      const pingInterval = setInterval(() => {
        trackListener(sessionId.current);
      }, 120000); // 2 minutes

      return () => clearInterval(pingInterval);
    }
  }, [isPlaying]);

  const currentTrackRef = useRef<Track | null>(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Sync with Global Radio Session
  const syncLiveState = async () => {
    try {
      const session = await getRadioSession();
      if (!session.track) {
         await rotateTrack();
         return;
      }

      const now = new Date();
      const startedAt = new Date(session.started_at);
      let diffMs = now.getTime() - startedAt.getTime();
      
      // Handle potential clock drift or mismatch
      if (diffMs < 0) {
        if (diffMs < -3600000) { // More than 1 hour off
           console.warn('সার্ভারের সাথে সময়ের অসংগতি অনেক বেশি:', diffMs, 'ms');
           await rotateTrack();
           return;
        }
        diffMs = 0;
      }
      
      const durationSec = session.track.duration || 240; 
      const durationMs = durationSec * 1000;

      if (diffMs < durationMs) {
        // Only update state if track changed or it's our first time
        if (!currentTrackRef.current || currentTrackRef.current.id !== session.track.id) {
          console.log(`ট্র্যাক পরিবর্তন করা হচ্ছে: ${session.track.title}`);
          setCurrentTrack(session.track);
        }
        setLiveOffset(diffMs / 1000);
      } else {
        // Track ended, pick next
        console.log('ট্র্যাকের সময় শেষ, পরবর্তী গান লোড করা হচ্ছে...');
        await rotateTrack();
      }
    } catch (err) {
      console.error('লাইভ স্টেট সিঙ্ক করতে ব্যর্থ হয়েছে:', err);
    }
  };

  const rotateTrack = async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    try {
      const currentOffset = audioRef.current?.currentTime;
      const nextTrack = await pickNextLiveTrack(currentOffset);
      if (nextTrack) {
        // Handle resume offset if present
        let startedAt = new Date();
        if ((nextTrack as any).resume_from) {
           const resumeMs = (nextTrack as any).resume_from * 1000;
           startedAt = new Date(startedAt.getTime() - resumeMs);
           console.log(`ট্র্যাক রিসুম করা হচ্ছে, অফসেট: ${ (nextTrack as any).resume_from }s`);
        }
        
        await updateRadioSession(nextTrack, startedAt);
        // Always sync state locally after update to ensure immediate feedback
        await syncLiveState();
      }
    } catch (err) {
      console.error('পরবর্তী গান সেট করতে ব্যর্থ হয়েছে:', err);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const loadTimes = async () => {
    // Load Station Settings
    const { data: stS } = await supabase.from('station_settings').select('*').eq('id', 1).maybeSingle();
    if (stS) setSettings(stS);

    // Load Prayer Times
    const { data: pt } = await supabase.from('prayer_times').select('*').eq('id', 1).maybeSingle();
    if (pt) setPrayerTimes(pt);
    
    // Load Scheduled Track Times
    const { data: st } = await supabase
      .from('tracks')
      .select('scheduled_time')
      .not('scheduled_time', 'is', null)
      .in('type', ['news', 'program', 'advertisement']);
    
    // Load Advertisement Schedule Times
    const { data: adS } = await supabase
      .from('advertisement_schedules')
      .select('start_time')
      .eq('active', true)
      .eq('type', 'time');

    let allScheduled = (st as any[] || []).map((t: any) => (t.scheduled_time as string).substring(0, 5));
    if (adS) {
      const adTimes = (adS as any[]).map((t: any) => (t.start_time as string).substring(0, 5));
      allScheduled = [...new Set([...allScheduled, ...adTimes])];
    }
    setScheduledTimes(allScheduled);

    // Load External Stream Times
    const { data: es } = await supabase
      .from('external_streams')
      .select('schedule_time, end_time, days_of_week')
      .eq('active', true);
    if (es) {
      setExternalStreamTimes((es as any[]).map((s: any) => ({
        time: (s.schedule_time as string).substring(0, 5),
        endTime: (s.end_time as string).substring(0, 5),
        days: s.days_of_week
      })));
    }
  };

  useEffect(() => {
    // Initial sync and load
    syncLiveState();
    loadTimes();

    // Regular intervals
    const stInterval = setInterval(loadTimes, 900000); // Every 15 minutes

    // Subscribe to realtime changes on the radio session table
    const channel = supabase
      .channel('radio-session-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'radio_session', filter: 'id=eq.1' },
        (payload) => {
          console.log('রেডিও সেশন আপডেট হয়েছে, নতুন ডাটা লোড করা হচ্ছে...', payload.new);
          syncLiveState();
        }
      )
      .subscribe();

    // Subscribe to tracks changes (for new scheduled content)
    const tracksChannel = supabase
      .channel('tracks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracks' },
        (payload) => {
          // If a track with scheduled_time is modified/added, reload times
          const newTrack = payload.new as any;
          const oldTrack = payload.old as any;
          if ((newTrack?.scheduled_time) || (oldTrack?.scheduled_time)) {
             console.log('সিডিউল পরিবর্তন হয়েছে, পুনরায় লোড করা হচ্ছে...');
             loadTimes();
          }
        }
      )
      .subscribe();

    // Subscribe to external streams changes
    const streamsChannel = supabase
      .channel('external-streams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'external_streams' },
        () => {
          console.log('বাহ্যিক স্ট্রিম সিডিউল পরিবর্তন হয়েছে, পুনরায় লোড করা হচ্ছে...');
          loadTimes();
        }
      )
      .subscribe();

    // Subscribe to advertisement schedules changes
    const adChannel = supabase
      .channel('ad-schedules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertisement_schedules' },
        () => {
          console.log('বিজ্ঞাপন সিডিউল পরিবর্তন হয়েছে, পুনরায় লোড করা হচ্ছে...');
          loadTimes();
        }
      )
      .subscribe();


    // Regular interval to keep everything in sync (Smart Segue)
    const interval = setInterval(() => {
       const now = new Date();
       const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
       const nowH = bdTime.getHours();
       const nowM = bdTime.getMinutes();
       const nowS = bdTime.getSeconds();
       const nowStr = bdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
       const day = bdTime.getDay();
       
       // Handle Time-Aware Playback Adjustments (Smart Segue/Fit-to-Time)
       if (audioRef.current && currentTrackRef.current && isPlayingRef.current) {
          const cueOut = currentTrackRef.current.cue_out || currentTrackRef.current.duration || 240;
          const currentPos = audioRef.current.currentTime;
          const remaining = cueOut - currentPos;
          const crossfade_dur = settings?.crossfade_duration || 5;
          
          // 1. Hard Sync for Top of Hour (News)
          // At :59:55 we start fading out if a song is still playing to hit news exactly at :00
          if (nowM === 59 && nowS >= 55) {
             const fadeOutVolume = Math.max(0, (60 - nowS) / 5); 
             const baseVolume = (localStorage.getItem('radio_volume') ? JSON.parse(localStorage.getItem('radio_volume')!)[0] : 70) / 100;
             audioRef.current.volume = baseVolume * fadeOutVolume;
             
             if (nowS >= 59.5) {
                console.log('⏰ ঘন্টার শুরুতে সংবাদের জন্য গান বন্ধ করা হচ্ছে (Hard Sync)');
                rotateTrack();
                return;
             }
          }

          // 1.5. Advanced Crossfade (Soft segue)
          // If we are near the end of the track, start fading out and trigger rotate early
          if (remaining < crossfade_dur && remaining > 0) {
             const fadeFactor = remaining / crossfade_dur; // 1.0 down to 0.0
             const baseVolume = (localStorage.getItem('radio_volume') ? JSON.parse(localStorage.getItem('radio_volume')!)[0] : 70) / 100;
             audioRef.current.volume = baseVolume * fadeFactor;
             
             if (remaining < 0.5) {
                console.log(`🎶 গান শেষ হচ্ছে (${crossfade_dur}s ক্রসফেড), নতুন গান শুরু হচ্ছে...`);
                rotateTrack();
                return;
             }
          }

          // 2. Playback Rate Adjustment (Smart Fitting)
          // If we are within 5 minutes of an event and the song is slightly longer or shorter,
          // we can adjust the playback rate between 0.97 and 1.05 to make it fit perfectly.
          if (nowM >= 55) {
             const secondsUntilHour = (60 - nowM) * 60 - nowS;
             const diff = remaining - secondsUntilHour;
             
             if (Math.abs(diff) < 20) { // If it's within 20s of the goal
                const idealRate = remaining / secondsUntilHour;
                const safeRate = Math.min(Math.max(idealRate, 0.95), 1.05);
                if (audioRef.current.playbackRate !== safeRate) {
                   audioRef.current.playbackRate = safeRate;
                   console.log(`⚡ ফিট করার জন্য গানের গতি পরিবর্তন: ${safeRate.toFixed(2)}x (বাকি ${diff.toFixed(1)}s)`);
                }
             } else {
                audioRef.current.playbackRate = 1.0;
             }
          } else if (audioRef.current.playbackRate !== 1.0) {
             audioRef.current.playbackRate = 1.0;
          }

          // 3. Emergency rotation if track ended locally
          if (remaining <= 0) {
             console.log('গান শেষ হয়েছে, পরবর্তী গান লোড করা হচ্ছে...');
             rotateTrack();
             return;
          }
       }

       // 0. Handle Hourly Time trigger (at :00)
       if (nowM === 0 && nowS < 10) {
         const timeKey = `time_${bdTime.getHours()}`;
         if (lastTimeCheckRef.current !== timeKey) {
            lastTimeCheckRef.current = timeKey;
            console.log(`⏰ সময়ের এনাউন্সমেন্ট শুরু হচ্ছে: ${bdTime.getHours()}:০০`);
            rotateTrack();
            return;
         }
       }
       
       // 1. Handle Prayer Time trigger
       const pTimesData = prayerTimesRef.current;
       if (pTimesData && pTimesData.active) {
         const pTimes = [
           pTimesData.fajr_time,
           day === 5 ? pTimesData.jummah_time : pTimesData.dhuhr_time,
           pTimesData.asr_time,
           pTimesData.maghrib_time,
           pTimesData.isha_time
         ].map(t => t?.substring(0, 5)).filter(Boolean);

         if (pTimes.includes(nowStr)) {
           const prayerTimeKey = `prayer_${nowStr}`;
           if (lastTimeCheckRef.current !== prayerTimeKey) {
              lastTimeCheckRef.current = prayerTimeKey;
              // Check if already an adhan
              if (currentTrackRef.current?.type === 'adhan') {
                 console.log('ইতিমধ্যে আযান চলছে, স্কিপ করা হচ্ছে');
                 return;
              }
              console.log(`আযানের সময় হয়েছে: ${nowStr}`);
              rotateTrack();
              return;
           }
         }
       }

       // 2. Handle Scheduled Content (News/Programs/Advertisements) trigger
       const sTimesData = scheduledTimesRef.current;
       if (sTimesData.includes(nowStr)) {
         const scheduledKey = `scheduled_${nowStr}`;
         if (lastTimeCheckRef.current !== scheduledKey) {
            lastTimeCheckRef.current = scheduledKey;
            
            // For scheduled content, we also check if current track is priority
            const currentType = currentTrackRef.current?.type;
            const isPriority = currentType === 'news' || currentType === 'program' || currentType === 'adhan' || currentType === 'advertisement' || currentType === 'external_stream';
            
            if (isPriority) {
               console.log('ইতিমধ্যে গুরুত্বপূর্ণ কিছু চলছে, স্কিপ করা হচ্ছে');
            } else {
               console.log(`সিডিউল করা অনুষ্ঠানের সময় হয়েছে: ${nowStr}`);
               rotateTrack();
               return;
            }
         }
       }

       // 3. Handle External Stream trigger (Start and End)
       const eStreamData = externalStreamTimesRef.current;
       const matchingStart = eStreamData.find(s => s.time === nowStr && s.days.includes(day));
       const matchingEnd = eStreamData.find(s => s.endTime === nowStr && s.days.includes(day));
       
       if (matchingStart) {
         const streamKey = `external_stream_start_${nowStr}`;
         if (lastTimeCheckRef.current !== streamKey) {
            lastTimeCheckRef.current = streamKey;
            
            if (currentTrackRef.current?.type === 'external_stream') {
               console.log('ইতিমধ্যে বাহ্যিক স্ট্রিম চলছে, স্কিপ করা হচ্ছে');
            } else {
               console.log(`📡 বাহ্যিক স্ট্রিম শুরুর সময় হয়েছে: ${nowStr}`);
               rotateTrack();
               return;
            }
         }
       } else if (matchingEnd) {
         const streamKey = `external_stream_end_${nowStr}`;
         if (lastTimeCheckRef.current !== streamKey) {
            lastTimeCheckRef.current = streamKey;
            
            if (currentTrackRef.current?.type === 'external_stream') {
               console.log(`🛑 বাহ্যিক স্ট্রিম শেষ করার সময় হয়েছে: ${nowStr}`);
               rotateTrack();
               return;
            }
         }
       }
       
       // Periodically sync state even when playing to handle track ending in DB
       syncLiveState();

       // Emergency rotation if track ended locally
       if (isPlayingRef.current && currentTrackRef.current && audioRef.current) {
          const duration = currentTrackRef.current.duration || 240;
          const remaining = duration - audioRef.current.currentTime;
          if (remaining <= 0) {
             console.log('গান শেষ হয়েছে, পরবর্তী গান লোড করা হচ্ছে...');
             rotateTrack();
          }
       }
    }, 1000); // Check every 1s for precision

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tracksChannel);
      supabase.removeChannel(streamsChannel);
      supabase.removeChannel(adChannel);
      clearInterval(interval);
      clearInterval(stInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Watch for isPlaying and currentTrack changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      try {
        if (currentTrack.type === 'external_stream') {
           // For external live streams, we don't seek. Just play.
           if (isPlaying) {
             audioRef.current.play().catch(e => console.warn("External stream play failed:", e));
           } else {
             audioRef.current.pause();
           }
           return;
        }

        const cueIn = currentTrack.cue_in || 0;
        const targetOffset = liveOffset + cueIn;
        const diff = Math.abs(audioRef.current.currentTime - targetOffset);
        
        // Only seek if we have metadata and the difference is significant
        if (audioRef.current.readyState >= 1 && diff > 5) {
          console.log(`সিঙ্ক অফসেট (Cue-In সহ): ${targetOffset}s`);
          audioRef.current.currentTime = targetOffset;
        }
        
        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.warn("Autoplay blocked or playback error:", e);
            });
          }
        } else {
          audioRef.current.pause();
        }
      } catch (err) {
        console.warn("অডিও সিঙ্ক ত্রুটি:", err);
      }
    }
  }, [currentTrack?.id, isPlaying, liveOffset]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Try to play immediately to satisfy browser interaction requirements
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              // After playing starts, we can sync the position
              syncLiveState();
            })
            .catch(err => {
              console.error("প্লেব্যাক শুরু করতে ব্যর্থ হয়েছে:", err);
              // If initial play fails, sync and try again
              syncLiveState().then(() => {
                if (audioRef.current) {
                   audioRef.current.play()
                     .then(() => setIsPlaying(true))
                     .catch(e => console.error("রোটেশনের পরও প্লেব্যাক ব্যর্থ:", e));
                }
              });
            });
        }
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      // Base volume from slider
      const baseVolume = volume[0] / 100;
      
      // ডাকিং লজিক: কুইককার্ট বা জিঙ্গেল চলাকালীন ব্যাকগ্রাউন্ড অডিও কমিয়ে দেওয়া
      // যদি গান বাজতে থাকে, তবে তা এমনিতেই একটু কমিয়ে (৮০%) বাজানো হবে
      let multiplier = isDucked ? 0.2 : 1.0; 
      
      if (!isDucked && currentTrack?.type === 'song') {
        multiplier = 0.8; 
      }
      
      audioRef.current.volume = baseVolume * multiplier;
    }
  }, [volume, currentTrack?.type, isDucked]);

  useEffect(() => {
    localStorage.setItem('radio_volume', JSON.stringify(volume));
  }, [volume]);

  const getTrackIcon = () => {
    switch (currentTrack?.type) {
      case 'news': return <Mic className="text-white w-6 h-6" />;
      case 'adhan': return <Clock className="text-white w-6 h-6" />;
      case 'program': return <Radio className="text-white w-6 h-6" />;
      case 'external_stream': return <Radio className="text-white w-6 h-6 animate-pulse" />;
      default: return isPlaying ? <Waves className="text-white w-6 h-6 animate-bounce" /> : <Music className="text-white w-6 h-6" />;
    }
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
    >
        <div className="max-w-7xl mx-auto bg-card/90 backdrop-blur-2xl border border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden relative group">
          
          <div className="h-1.5 w-full bg-muted/30 overflow-hidden relative">
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className={`h-full bg-gradient-to-r from-transparent via-primary to-transparent w-1/2 absolute ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>

          <div className="p-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-1/3">
              <div className="relative group shrink-0">
                <div className={`absolute inset-0 bg-primary rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity ${isPlaying ? 'animate-pulse' : ''}`} />
                <div className="relative bg-gradient-to-br from-primary to-accent p-3 rounded-2xl shadow-lg">
                  {getTrackIcon()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-sm font-black tracking-widest animate-pulse">LIVE</span>
                   <h3 className="font-black text-sm md:text-base truncate tracking-tight text-foreground">
                    {currentTrack?.title || 'রেডিও শুনুন'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <p className="text-xs text-muted-foreground font-bold truncate">
                    {currentTrack?.artist || 'টাঙ্গাইল রেডিও'} {currentTrack?.type && currentTrack.type !== 'song' ? `• ${currentTrack.type.toUpperCase()}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button 
                size="icon" 
                className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${isPlaying ? 'bg-primary hover:bg-primary/90' : 'bg-red-500 hover:bg-red-600 animate-bounce'}`}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 ml-1 fill-current" />}
              </Button>
              <audio
                key={currentTrack?.id || 'no-track'}
                ref={audioRef}
                src={currentTrack?.audio_url}
                onEnded={rotateTrack}
                preload="auto"
                hidden
                loop={false}
              />
            </div>

            <div className="hidden md:flex items-center gap-4 w-1/3 justify-end">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
                <Slider
                  value={volume}
                  max={100}
                  step={1}
                  onValueChange={setVolume}
                  className="w-24 lg:w-32"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
  );
};
