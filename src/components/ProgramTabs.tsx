import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, SkipForward, History, Music, Radio, Clock, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/db/supabase';
import { fetchPlaybackHistory, getRadioSession, fetchPrograms } from '@/db/api';
import type { Track, Program } from '../types/types';

export const ProgramTabs: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [upcomingPrograms, setUpcomingPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [session, historyData, programsData] = await Promise.all([
        getRadioSession().catch(() => ({ track: null })),
        fetchPlaybackHistory(15).catch(() => []),
        fetchPrograms().catch(() => [])
      ]);
      
      setCurrentTrack(session?.track || null);
      setHistory(Array.isArray(historyData) ? historyData : []);

      // Get upcoming programs (Bangladesh Time)
      const now = new Date();
      
      // Safer way to get BD hour and minute
      const bdOptions = { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false } as const;
      const nowStr = new Intl.DateTimeFormat('en-GB', bdOptions).format(now);
      
      // Get Bangladesh Day of Week (0-6)
      const bdDayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short' }).format(now);
      const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      const currentDay = dayMap[bdDayStr] ?? now.getDay();
      
      const upcoming = (programsData || [])
        .filter(p => p.active && p.days_of_week.includes(currentDay) && (p.schedule_time || '') > nowStr)
        .sort((a, b) => (a.schedule_time || '').localeCompare(b.schedule_time || ''))
        .slice(0, 2);
      setUpcomingPrograms(upcoming);
    } catch (err) {
      console.error('লাইভ স্ট্যাটাস লোড করতে সমস্যা হয়েছে:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    const sessionChannel = supabase
      .channel('radio-session-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_session' }, () => {
        loadData();
      })
      .subscribe();

    const historyChannel = supabase
      .channel('playback-history-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'playback_history' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(historyChannel);
    };
  }, []);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  const CompactTrackItem = ({ track, status }: { track: any, status?: string }) => {
    if (!track) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/20 border border-muted-foreground/5 group hover:bg-muted/40 transition-all"
      >
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {status === 'now' ? <Radio className="w-4 h-4 animate-pulse" /> : <Music className="w-4 h-4" />}
          </div>
          {status === 'now' && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
             {status === 'now' && <span className="text-[7px] font-black uppercase tracking-tighter text-primary bg-primary/10 px-1 py-0.5 rounded-full shadow-sm">LIVE</span>}
             <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors leading-tight">
                {track.title || (status === 'now' ? 'লাইভ ব্রডকাস্টিং...' : 'অজানা গান')}
             </h4>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="truncate max-w-[100px]">{track.artist || 'টাঙ্গাইল রেডিও'}</span>
            {(track.started_at || track.created_at) && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0"><Clock className="w-2 h-2" /> {formatTime(track.started_at || track.created_at)}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md rounded-[2rem] overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="now" className="w-full">
          <div className="px-6 pt-6 pb-2">
             <TabsList className="bg-muted/50 p-1 rounded-2xl w-full">
               <TabsTrigger value="now" className="flex-1 gap-2 rounded-xl font-bold text-xs"><Radio className="w-3.5 h-3.5" /> এখন</TabsTrigger>
               <TabsTrigger value="history" className="flex-1 gap-2 rounded-xl font-bold text-xs"><History className="w-3.5 h-3.5" /> ইতিহাস</TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="now" className="p-6 pt-2 space-y-4 focus-visible:outline-none">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">বর্তমানে বাজছে</p>
              {currentTrack ? (
                <CompactTrackItem track={currentTrack} status="now" />
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs bg-muted/20 rounded-2xl border border-dashed">
                   কোনো গান বাজছে না
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">আসন্ন আয়োজন</p>
              {upcomingPrograms.length > 0 ? (
                upcomingPrograms.map((prog, i) => (
                  <div key={prog.id || i} className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                       {prog.image_url ? (
                         <img src={prog.image_url} className="w-full h-full object-cover" alt={prog.title} />
                       ) : (
                         <Calendar className="w-4 h-4" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h5 className="text-xs font-bold truncate">{prog.title}</h5>
                       <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                         <Clock className="w-2.5 h-2.5" /> {prog.schedule_time} 
                         {prog.host_name && <>• <User className="w-2.5 h-2.5 ml-1" /> {prog.host_name}</>}
                       </p>
                    </div>
                  </div>
                ))
              ) : null}
              
              <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <SkipForward className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold truncate">পরবর্তী গান শীঘ্রই...</h5>
                  <p className="text-[10px] text-muted-foreground">অটো-ডিজে দ্বারা নির্ধারিত হবে</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-6 pt-2 space-y-3 focus-visible:outline-none h-[300px] overflow-y-auto">
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 sticky top-0 bg-card py-2 z-10">প্লেব্যাক ইতিহাস</p>
             <div className="space-y-2">
                {history.length > 0 ? (
                  history.map((item, i) => (
                    <CompactTrackItem key={item.id || i} track={item} />
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <History className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-medium">বর্তমানে কোনো ইতিহাস নেই</p>
                    <p className="text-[10px] opacity-60">রেডিও শুনুন ইতিহাস তৈরি করতে</p>
                  </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
