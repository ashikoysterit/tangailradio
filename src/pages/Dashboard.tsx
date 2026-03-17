import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap,
  Plus, 
  Trash2, 
  Music, 
  Mic,
  Image as ImageIcon, 
  Bell, 
  Newspaper, 
  Settings, 
  Upload, 
  Loader2, 
  LogOut, 
  Shuffle, 
  ListOrdered, 
  Clock,
  Radio,
  Calendar,
  Edit,
  Users,
  Activity,
  Headphones,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Tv,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { 
  fetchNews, createNews, deleteNews, 
  fetchNotices, createNotice, deleteNotice,
  fetchSlider, createSliderImage, deleteSliderImage,
  fetchTracks, createTrack, deleteTrack, updateTrack,
  fetchSettings, updateSettings,
  fetchDashboardStats,
  fetchPrayerTimes,
  fetchPlaylists
} from '@/db/api';
import { News, Notice, SliderImage, Track, StationSettings, AudioType, DashboardStats, Playlist } from '../types/types';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as mm from 'music-metadata-browser';
import { motion } from 'framer-motion';
import { ScheduleManager } from '@/components/ScheduleManager';
import { PrayerTimesManager } from '@/components/PrayerTimesManager';
import { PrayerTimesManagerEnhanced } from '@/components/PrayerTimesManagerEnhanced';
import { ProgramsManager } from '@/components/ProgramsManager';
import { NewsContentManager } from '@/components/NewsContentManager';
import { ProgramContentManager } from '@/components/ProgramContentManager';
import { AdvertisementManager } from '@/components/AdvertisementManager';
import { ExternalStreamsManager } from '@/components/ExternalStreamsManager';
import { TimeAnnouncementManager } from '@/components/TimeAnnouncementManager';
import { VoiceTrackingManager } from '@/components/VoiceTrackingManager';

import { CommentsManager } from '@/components/CommentsManager';
import { SongPlaylistManager } from '@/components/SongPlaylistManager';

import { QuickCartsManager } from '@/components/QuickCartsManager';
import { ClockManager } from '@/components/ClockManager';
import { ClockScheduler } from '@/components/ClockScheduler';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Dashboard: React.FC = () => {
  const { signOut, profile, loading } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [sliders, setSliders] = useState<SliderImage[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [settings, setSettings] = useState<StationSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadData();
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(loadStats, 30000);
    return () => clearInterval(statsInterval);
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await fetchDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const loadData = async () => {
    try {
      const [newsData, noticesData, slidersData, tracksData, settingsData] = await Promise.all([
        fetchNews(),
        fetchNotices(),
        fetchSlider(),
        fetchTracks(), // Fetch all types
        fetchSettings()
      ]);
      setNews(newsData);
      setNotices(noticesData);
      setSliders(slidersData);
      setTracks(tracksData);
      setSettings(settingsData);
      
      // Load stats
      await loadStats();
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleFileUpload = async (file: File, bucket: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

      // We use a custom fetch/xhr if onUploadProgress isn't supported by the version
      // but let's try the modern way first.
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          // @ts-ignore - Some versions might have different types for onUploadProgress
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error(err);
      toast.error('ফাইল আপলোড ব্যর্থ হয়েছে');
      return null;
    } finally {
      setIsUploading(false);
      // Wait a bit before hiding progress for better UX
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const AutomationMonitor = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentSession, setCurrentSession] = useState<any>(null);

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      
      const fetchSession = async () => {
        const { data } = await supabase.from('radio_session').select('*').eq('id', 1).maybeSingle();
        setCurrentSession(data);
      };
      fetchSession();
      const sessionInterval = setInterval(fetchSession, 5000);

      return () => {
        clearInterval(timer);
        clearInterval(sessionInterval);
      };
    }, []);

    const bdTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const mins = bdTime.getMinutes();
    const secs = bdTime.getSeconds();
    const remainingMins = 59 - mins;
    const remainingSecs = 59 - secs;

    return (
      <div className="space-y-6 mb-8">
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary text-white rounded-2xl shadow-lg">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">স্টেশন অটোমেশন মনিটর</h3>
                  <p className="text-sm text-muted-foreground">রিয়েল-টাইম প্লেব্যাক এবং শিডিউল ট্র্যাকিং</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground mb-1">বর্তমান সময়</p>
                  <p className="text-2xl font-black font-mono">
                    {bdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground mb-1">ঘন্টা শেষ হতে বাকি</p>
                  <p className="text-2xl font-black font-mono text-primary">
                    {remainingMins}:{remainingSecs.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs uppercase font-bold text-muted-foreground mb-1">স্ট্যাটাস</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-bold text-green-600">অন এয়ার (Live)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {mins >= 55 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3 text-orange-700"
              >
                <Zap className="w-4 h-4 animate-bounce" />
                <span className="text-sm font-bold">Smart-Fit সক্রিয়: ঘন্টার শুরুতে সংবাদের সাথে গান মেলানোর জন্য গতি সামঞ্জস্য করা হচ্ছে।</span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {currentSession?.current_track_title && (
          <Card className="border-none bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-6 p-6">
                <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center relative group overflow-hidden">
                  <Music className="w-10 h-10 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Headphones className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Now Playing</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-medium text-white/60">Live Automation</span>
                  </div>
                  <h4 className="text-2xl font-black truncate leading-tight mb-1">{currentSession.current_track_title}</h4>
                  <div className="flex items-center gap-4 text-sm text-white/60 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4" />
                      {currentSession.current_track_type || 'Song'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-green-400" />
                      অটো-ডিজে সক্রিয়
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-white/10 w-full">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: currentSession.current_track_duration || 240, ease: "linear" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Sub-components for Each Section
  const NewsManager = () => {
    const [content, setContent] = useState('');
    const handleAdd = async () => {
      if (!content) return;
      await createNews(content);
      setContent('');
      loadData();
      toast.success('নিউজ যোগ করা হয়েছে');
    };
    return (
      <Card>
        <CardHeader><CardTitle>ব্রেকিং নিউজ ম্যানেজমেন্ট</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={content} onChange={e => setContent(e.target.value)} placeholder="নতুন নিউজ লিখুন..." />
            <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1" /> যোগ করুন</Button>
          </div>
          <div className="space-y-2">
            {news.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                <span>{item.content}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteNews(item.id).then(loadData)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const NoticeManager = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const handleAdd = async () => {
      if (!title || !content) return;
      await createNotice(title, content);
      setTitle(''); setContent('');
      loadData();
      toast.success('নোটিশ যোগ করা হয়েছে');
    };
    return (
      <Card>
        <CardHeader><CardTitle>নোটিশ বোর্ড ম্যানেজমেন্ট</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="নোটিশ টাইটেল" />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="নোটিশ বিষয়বস্তু" />
          <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-1" /> যোগ করুন</Button>
          <div className="space-y-2">
            {notices.map(item => (
              <div key={item.id} className="p-3 border rounded space-y-1 relative group">
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.content}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteNotice(item.id).then(loadData)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SliderManager = () => {
    const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await handleFileUpload(file, 'tangail_radio_images');
      if (url) {
        await createSliderImage(url);
        loadData();
        toast.success('স্লাইডার ছবি যোগ করা হয়েছে');
      }
    };
    return (
      <Card>
        <CardHeader><CardTitle>পিকচার স্লাইডার ম্যানেজমেন্ট</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 bg-muted/10">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-4" />
            <Button asChild disabled={isUploading}>
              <label>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                ছবি আপলোড করুন (Gallery)
                <input type="file" className="hidden" accept="image/*" onChange={handleAdd} />
              </label>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sliders.map(item => (
              <div key={item.id} className="relative group rounded-lg overflow-hidden h-32">
                <img src={item.image_url} className="w-full h-full object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteSliderImage(item.id).then(loadData)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SettingsManager = () => {
    const [localSettings, setLocalSettings] = useState<StationSettings | null>(settings);
    useEffect(() => { setLocalSettings(settings); }, [settings]);
    const handleSave = async () => {
      if (!localSettings) return;
      await updateSettings(localSettings);
      loadData();
      toast.success('সেটিংস আপডেট করা হয়েছে');
    };
    if (!localSettings) return null;
    return (
      <Card>
        <CardHeader><CardTitle>স্টেশন সেটিংস</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">স্টেশনের নাম</label>
              <Input value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">চেয়ারম্যান</label>
              <Input value={localSettings.chairman} onChange={e => setLocalSettings({...localSettings, chairman: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">মোবাইল</label>
              <Input value={localSettings.mobile} onChange={e => setLocalSettings({...localSettings, mobile: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ইমেইল</label>
              <Input value={localSettings.email} onChange={e => setLocalSettings({...localSettings, email: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">ঠিকানা</label>
              <Input value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
            </div>
          </div>
        </CardContent>
        <CardFooter><Button onClick={handleSave} className="w-full">সংরক্ষণ করুন</Button></CardFooter>
      </Card>
    );
  };

  const AutoDJManager = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    useEffect(() => {
      fetchPlaylists().then(setPlaylists);
    }, []);

    const handleModeChange = async (mode: 'shuffle' | 'sequential') => {
      if (!settings) return;
      await updateSettings({ playback_mode: mode });
      loadData();
      toast.success(`${mode === 'shuffle' ? 'শাফেল' : 'সিকুয়েনশিয়াল'} মোড সেট করা হয়েছে`);
    };

    const handleToggleSetting = async (key: string, value: any) => {
      if (!settings) return;
      await updateSettings({ [key]: value });
      loadData();
      toast.success('সেটিংস আপডেট করা হয়েছে');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                প্লেব্যাক মোড (Auto-DJ)
              </CardTitle>
              <CardDescription>আপনার স্টেশন সচল রাখতে অটো ডিজে সেটিংস সেট করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`hover:border-primary transition-all cursor-pointer p-6 flex flex-col items-center gap-3 ${settings?.playback_mode === 'shuffle' ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary' : 'bg-muted/10 opacity-60'}`}
                  onClick={() => handleModeChange('shuffle')}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shuffle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">শাফেল মোড</p>
                    <p className="text-[10px] text-muted-foreground mt-1">সব গান এলোমেলোভাবে চলবে</p>
                  </div>
                </Card>
                <Card 
                  className={`hover:border-primary transition-all cursor-pointer p-6 flex flex-col items-center gap-3 ${settings?.playback_mode === 'sequential' ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary' : 'bg-muted/10 opacity-60'}`}
                  onClick={() => handleModeChange('sequential')}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <ListOrdered className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">সিকুয়েনশিয়াল মোড</p>
                    <p className="text-[10px] text-muted-foreground mt-1">সিরিয়াল অনুযায়ী গান চলবে</p>
                  </div>
                </Card>
              </div>

              <div className="p-4 bg-muted/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">গ্যাপলেস প্লেব্যাক (Gapless)</Label>
                    <p className="text-[10px] text-muted-foreground">গানের মাঝে কোনো বিরতি থাকবে না</p>
                  </div>
                  <Button 
                    variant={settings?.gapless_playback ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 rounded-full"
                    onClick={() => handleToggleSetting('gapless_playback', !settings?.gapless_playback)}
                  >
                    {settings?.gapless_playback ? 'চালু' : 'বন্ধ'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">অটো সাইলেন্স ট্রিম (Auto-Trim)</Label>
                    <p className="text-[10px] text-muted-foreground">গানের শুরুর ও শেষের নিরবতা বাদ দিবে</p>
                  </div>
                  <Button 
                    variant={settings?.auto_trim_silence ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 rounded-full"
                    onClick={() => handleToggleSetting('auto_trim_silence', !settings?.auto_trim_silence)}
                  >
                    {settings?.auto_trim_silence ? 'চালু' : 'বন্ধ'}
                  </Button>
                </div>

                <div className="pt-2 border-t mt-4">
                  <Label className="text-sm font-bold block mb-2">ডিফল্ট অটো-ডিজে প্লেলিস্ট</Label>
                  <Select 
                    value={settings?.default_playlist_id || "all"} 
                    onValueChange={(v) => handleToggleSetting('default_playlist_id', v === "all" ? null : v)}
                  >
                    <SelectTrigger className="h-9 bg-background/50">
                      <SelectValue placeholder="সব গান থেকে (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব গান থেকে (Library)</SelectItem>
                      {playlists.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">নির্দিষ্ট প্লেলিস্ট থেকে অটো-ডিজে গান নির্বাচন করবে।</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                অ্যাডভান্সড সেটিংস
              </CardTitle>
              <CardDescription>প্লেব্যাক ও ট্রানজিশন নিখুঁত করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">ক্রসফেড ডিউরেশন (Crossfade)</Label>
                  <span className="text-sm font-mono font-bold text-primary">{settings?.crossfade_duration} সেকেন্ড</span>
                </div>
                <Slider 
                  value={[settings?.crossfade_duration || 5]} 
                  max={15} 
                  step={1} 
                  onValueChange={(val) => handleToggleSetting('crossfade_duration', val[0])}
                />
                <p className="text-[10px] text-muted-foreground italic">গানের শেষে পরবর্তী গানটি কত সেকেন্ড আগে ওভারল্যাপ শুরু করবে।</p>
              </div>

              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 bg-primary/5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">ইন্টেলিজেন্ট ওয়েটেড সিলেকশন</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Auto-DJ বর্তমানে গান নির্বাচনের ক্ষেত্রে আপনার দেওয়া **Weight (গুরুত্ব)** এবং **Artist Separation** নিয়ম মেনে চলে। 
                      বেশি গুরুত্ব দেওয়া গানগুলো স্টেশনে বেশি প্রচারিত হবে।
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[10px] mt-2 text-primary font-bold">রুলস ম্যানেজ করুন (গানের তালিকা থেকে)</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-primary" />
              প্লেলিস্ট প্রিভিউ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x">
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-sm border-l-4 border-primary pl-2 uppercase tracking-wider">রিসেন্টলি প্লেড (Recently Played)</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {tracks.filter(t => t.last_played_at).sort((a,b) => new Date(b.last_played_at!).getTime() - new Date(a.last_played_at!).getTime()).slice(0, 10).map((track, i) => (
                    <div key={track.id} className="flex items-center gap-3 p-2 border rounded bg-background/50 hover:bg-muted/50 transition-colors">
                      <div className="text-[10px] font-mono text-muted-foreground">{new Date(track.last_played_at!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{track.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    </div>
                  ))}
                  {tracks.filter(t => t.last_played_at).length === 0 && <p className="text-center py-10 text-xs text-muted-foreground italic">এখনও কোনো গান প্রচার হয়নি</p>}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-sm border-l-4 border-orange-500 pl-2 uppercase tracking-wider">আপকামিং রোটেশন (Rotation Pool)</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {tracks.filter(t => t.type === 'song').sort((a,b) => (a.last_played_at ? 0 : 1) - (b.last_played_at ? 0 : 1) || (a.last_played_at ? new Date(a.last_played_at).getTime() : 0) - (b.last_played_at ? new Date(b.last_played_at).getTime() : 0)).slice(0, 10).map((track, i) => (
                    <div key={track.id} className="flex items-center gap-3 p-2 border rounded bg-background/50 hover:bg-muted/50 transition-colors">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{track.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      {(track.weight || 1) > 1 && <span className="text-[9px] bg-orange-500/20 text-orange-700 px-1 rounded font-bold">High Weight</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ScheduleManager = () => {
    const [scheduledTracks, setScheduledTracks] = useState<Track[]>([]);
    const [prayerSchedule, setPrayerSchedule] = useState<any>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);
    
    // ফর্ম স্টেট
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [scheduleType, setScheduleType] = useState<'news' | 'program'>('news');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleHost, setScheduleHost] = useState('');

    useEffect(() => {
      loadSchedule();
    }, []);

    const loadSchedule = async () => {
      try {
        // Load scheduled tracks
        const allTracks = await fetchTracks();
        const scheduled = allTracks.filter(t => t.scheduled_time);
        setScheduledTracks(scheduled.sort((a, b) => {
          const timeA = a.scheduled_time || '';
          const timeB = b.scheduled_time || '';
          return timeA.localeCompare(timeB);
        }));

        // Load prayer times
        const prayers = await fetchPrayerTimes();
        setPrayerSchedule(prayers);
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };

    // ২৪ ঘণ্টা থেকে ১২ ঘণ্টা ফরম্যাটে রূপান্তর
    const convertTo12Hour = (time24: string) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      const period = hours >= 5 && hours < 12 ? 'সকাল' : 
                     hours >= 12 && hours < 15 ? 'দুপুর' :
                     hours >= 15 && hours < 18 ? 'বিকাল' :
                     hours >= 18 && hours < 20 ? 'সন্ধ্যা' : 'রাত';
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getTypeLabel = (type?: string) => {
      switch (type) {
        case 'news': return 'সংবাদ';
        case 'program': return 'অনুষ্ঠান';
        case 'adhan': return 'আযান';
        default: return 'অন্যান্য';
      }
    };

    const getTypeBadgeColor = (type?: string) => {
      switch (type) {
        case 'news': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
        case 'program': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
        case 'adhan': return 'bg-green-500/10 text-green-700 dark:text-green-300';
        default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
      }
    };

    const handleAddSchedule = async () => {
      if (!scheduleTitle || !scheduleTime) {
        toast.error('শিরোনাম এবং সময় পূরণ করুন');
        return;
      }

      try {
        await createTrack({
          title: scheduleTitle,
          audio_url: '', // Placeholder - will be updated when audio is uploaded
          type: scheduleType,
          scheduled_time: scheduleTime,
          artist: scheduleHost || 'Tangail Radio'
        });
        
        toast.success('শিডিউল যুক্ত হয়েছে');
        setIsAddDialogOpen(false);
        setScheduleTitle('');
        setScheduleTime('');
        setScheduleHost('');
        loadSchedule();
      } catch (error) {
        console.error('Error adding schedule:', error);
        toast.error('শিডিউল যুক্ত করতে ব্যর্থ হয়েছে');
      }
    };

    const handleDeleteSchedule = async (id: string) => {
      if (!confirm('এই শিডিউলটি মুছে ফেলতে চান?')) return;
      
      try {
        await deleteTrack(id);
        toast.success('শিডিউল মুছে ফেলা হয়েছে');
        loadSchedule();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
      }
    };

    const handleEditSchedule = (track: Track) => {
      setEditingTrack(track);
      setScheduleTitle(track.title);
      setScheduleType(track.type as 'news' | 'program');
      setScheduleTime(track.scheduled_time || '');
      setScheduleHost(track.artist || '');
      setIsAddDialogOpen(true);
    };

    const handleUpdateSchedule = async () => {
      if (!editingTrack || !scheduleTitle || !scheduleTime) {
        toast.error('সকল তথ্য পূরণ করুন');
        return;
      }

      try {
        await updateTrack(editingTrack.id, {
          title: scheduleTitle,
          type: scheduleType,
          scheduled_time: scheduleTime,
          artist: scheduleHost || 'Tangail Radio'
        });
        
        toast.success('শিডিউল আপডেট হয়েছে');
        setIsAddDialogOpen(false);
        setEditingTrack(null);
        setScheduleTitle('');
        setScheduleTime('');
        setScheduleHost('');
        loadSchedule();
      } catch (error) {
        console.error('Error updating schedule:', error);
        toast.error('আপডেট করতে ব্যর্থ হয়েছে');
      }
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>দৈনিক শিডিউল</CardTitle>
              <CardDescription>আপনার রেডিও স্টেশনের সম্পূর্ণ দৈনিক কার্যক্রম</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingTrack(null);
                setScheduleTitle('');
                setScheduleTime('');
                setScheduleHost('');
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  নতুন শিডিউল
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTrack ? 'শিডিউল সম্পাদনা' : 'নতুন শিডিউল যুক্ত করুন'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>শিরোনাম *</Label>
                    <Input
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      placeholder="যেমন: সন্ধ্যা ৬টার সংবাদ"
                    />
                  </div>
                  <div>
                    <Label>ধরন *</Label>
                    <select
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value as 'news' | 'program')}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="news">সংবাদ</option>
                      <option value="program">অনুষ্ঠান</option>
                    </select>
                  </div>
                  <div>
                    <Label>সময় *</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  {scheduleType === 'program' && (
                    <div>
                      <Label>উপস্থাপক (ঐচ্ছিক)</Label>
                      <Input
                        value={scheduleHost}
                        onChange={(e) => setScheduleHost(e.target.value)}
                        placeholder="উপস্থাপকের নাম"
                      />
                    </div>
                  )}
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>দ্রষ্টব্য:</strong> শিডিউল তৈরির পর "সংবাদ অডিও" বা "অনুষ্ঠান অডিও" ট্যাবে গিয়ে অডিও ফাইল আপলোড করুন।
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>বাতিল</Button>
                    <Button onClick={editingTrack ? handleUpdateSchedule : handleAddSchedule}>
                      {editingTrack ? 'আপডেট করুন' : 'যুক্ত করুন'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* নামাজের সময়সূচী */}
          {prayerSchedule && prayerSchedule.active && (
            <div className="border rounded-xl p-4 bg-green-50 dark:bg-green-950/20">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                নামাজের সময়সূচী
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'ফজর', time: prayerSchedule.fajr_time },
                  { name: 'যোহর', time: prayerSchedule.dhuhr_time },
                  { name: 'আসর', time: prayerSchedule.asr_time },
                  { name: 'মাগরিব', time: prayerSchedule.maghrib_time },
                  { name: 'এশা', time: prayerSchedule.isha_time },
                  { name: 'জুম্মা', time: prayerSchedule.jummah_time }
                ].map((prayer) => (
                  <div key={prayer.name} className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                    <div className="text-sm font-bold text-green-700 dark:text-green-300">{prayer.name}</div>
                    <div className="text-lg font-black text-foreground">{convertTo12Hour(prayer.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* শিডিউলকৃত কন্টেন্ট */}
          <div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              শিডিউলকৃত সংবাদ ও অনুষ্ঠান ({scheduledTracks.length}টি)
            </h3>
            
            {scheduledTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                কোনো শিডিউল নেই। উপরে "নতুন শিডিউল" বাটনে ক্লিক করুন।
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledTracks.map((track) => (
                  <div
                    key={track.id}
                    className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-xl font-black text-primary">
                          {convertTo12Hour(track.scheduled_time || '')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{track.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getTypeBadgeColor(track.type)}`}>
                              {getTypeLabel(track.type)}
                            </span>
                          </div>
                          {track.artist && track.artist !== 'Tangail Radio' && (
                            <p className="text-xs text-muted-foreground mt-1">{track.artist}</p>
                          )}
                          {track.intro_url && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              ইন্ট্রো সহ
                            </p>
                          )}
                          {!track.audio_url && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              অডিও আপলোড করুন
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSchedule(track)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(track.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>স্বয়ংক্রিয় প্লেব্যাক:</strong> নির্ধারিত সময়ে সংবাদ ও অনুষ্ঠান স্বয়ংক্রিয়ভাবে প্লে হবে। 
              নামাজের সময় সবকিছু বন্ধ হয়ে আযান প্লে হবে এবং শেষ হলে আগের কন্টেন্ট পুনরায় চালু হবে।
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">প্রবেশাধিকার নেই</h1>
        <p className="text-muted-foreground mb-4">এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
        <Button onClick={() => signOut()}>লগ আউট করুন</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-muted/20 flex flex-col"
    >
      <header className="bg-card border-b border-border p-4 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-card/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <Radio className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 hidden md:block">
              Tangail Radio Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">অ্যাডমিন প্যানেল</p>
              <p className="text-sm font-bold tracking-tight">স্বাগতম, {profile?.username as string}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => signOut()} className="rounded-full px-6">
              <LogOut className="w-4 h-4 mr-2" /> লগ আউট
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 py-8 md:py-12">
        <AutomationMonitor />
        {/* Statistics Cards */}
        {stats && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">মোট গান</p>
                    <p className="text-2xl font-black text-blue-600">{stats.total_songs}</p>
                  </div>
                  <Music className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">মোট অনুষ্ঠান</p>
                    <p className="text-2xl font-black text-green-600">{stats.total_programs}</p>
                  </div>
                  <Radio className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">অনলাইন শ্রোতা</p>
                    <p className="text-2xl font-black text-purple-600">{stats.online_listeners}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">মোট শ্রোতা</p>
                    <p className="text-2xl font-black text-orange-600">{stats.total_listeners}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase">ভয়েস ট্র্যাক</p>
                    <p className="text-2xl font-black text-red-600">{stats.total_voiceovers}</p>
                  </div>
                  <Mic className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="songs_playlists" className="space-y-8">
          <div className="bg-card/50 backdrop-blur-sm p-1 rounded-2xl border border-border shadow-inner">
            <TabsList className="bg-transparent border-none w-full justify-start overflow-x-auto h-auto p-0 scrollbar-hide gap-1">
              <TabsTrigger value="quickcarts" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Zap className="w-4 h-4" /> কুইককার্টস</TabsTrigger>
              <TabsTrigger value="clocks" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Clock className="w-4 h-4" /> ক্লক টেমপ্লেট</TabsTrigger>
              <TabsTrigger value="clock_scheduler" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Calendar className="w-4 h-4" /> ক্লক শিডিউল</TabsTrigger>

              <TabsTrigger value="songs_playlists" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Music className="w-4 h-4" /> গান ও প্লেলিস্ট</TabsTrigger>
              <TabsTrigger value="news" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Newspaper className="w-4 h-4" /> ব্রেকিং নিউজ</TabsTrigger>
              <TabsTrigger value="news_audio" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Radio className="w-4 h-4" /> সংবাদ অডিও</TabsTrigger>
              <TabsTrigger value="program_listings" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Radio className="w-4 h-4" /> অনুষ্ঠানমালা (Home)</TabsTrigger>
              <TabsTrigger value="programs" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Tv className="w-4 h-4" /> অনুষ্ঠান অডিও</TabsTrigger>
              <TabsTrigger value="advertisements" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><DollarSign className="w-4 h-4" /> বিজ্ঞাপন</TabsTrigger>
              <TabsTrigger value="prayer" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Clock className="w-4 h-4" /> নামাজ</TabsTrigger>
              <TabsTrigger value="time_announcement" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Clock className="w-4 h-4" /> সময় এনাউন্সমেন্ট</TabsTrigger>
              <TabsTrigger value="voicetracking" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Mic className="w-4 h-4" /> ভয়েস ট্র্যাকিং</TabsTrigger>
              <TabsTrigger value="streams" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><ExternalLink className="w-4 h-4" /> স্ট্রিম</TabsTrigger>
              <TabsTrigger value="comments" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><MessageSquare className="w-4 h-4" /> মন্তব্য</TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Calendar className="w-4 h-4" /> শিডিউল</TabsTrigger>
              <TabsTrigger value="autodj" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Shuffle className="w-4 h-4" /> অটো ডিজে</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 px-6 transition-all font-bold"><Settings className="w-4 h-4" /> সেটিংস</TabsTrigger>
            </TabsList>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <TabsContent value="quickcarts" className="mt-0 focus-visible:outline-none"><QuickCartsManager /></TabsContent>
            <TabsContent value="clocks" className="mt-0 focus-visible:outline-none"><ClockManager /></TabsContent>
            <TabsContent value="clock_scheduler" className="mt-0 focus-visible:outline-none"><ClockScheduler /></TabsContent>
            <TabsContent value="songs_playlists" className="mt-0 focus-visible:outline-none"><SongPlaylistManager /></TabsContent>
            <TabsContent value="news" className="mt-0 focus-visible:outline-none"><NewsManager /></TabsContent>
            <TabsContent value="news_audio" className="mt-0 focus-visible:outline-none"><NewsContentManager /></TabsContent>
            <TabsContent value="program_listings" className="mt-0 focus-visible:outline-none"><ProgramsManager /></TabsContent>
            <TabsContent value="notices" className="mt-0 focus-visible:outline-none"><NoticeManager /></TabsContent>
            <TabsContent value="slider" className="mt-0 focus-visible:outline-none"><SliderManager /></TabsContent>
            <TabsContent value="programs" className="mt-0 focus-visible:outline-none"><ProgramContentManager /></TabsContent>
            <TabsContent value="advertisements" className="mt-0 focus-visible:outline-none"><AdvertisementManager /></TabsContent>
            <TabsContent value="prayer" className="mt-0 focus-visible:outline-none"><PrayerTimesManagerEnhanced /></TabsContent>
            <TabsContent value="time_announcement" className="mt-0 focus-visible:outline-none"><TimeAnnouncementManager /></TabsContent>
            <TabsContent value="voicetracking" className="mt-0 focus-visible:outline-none"><VoiceTrackingManager /></TabsContent>
            <TabsContent value="streams" className="mt-0 focus-visible:outline-none"><ExternalStreamsManager /></TabsContent>
            <TabsContent value="comments" className="mt-0 focus-visible:outline-none"><CommentsManager /></TabsContent>
            <TabsContent value="schedule" className="mt-0 focus-visible:outline-none"><ScheduleManager /></TabsContent>
            <TabsContent value="autodj" className="mt-0 focus-visible:outline-none"><AutoDJManager /></TabsContent>
            <TabsContent value="settings" className="mt-0 focus-visible:outline-none"><SettingsManager /></TabsContent>
          </motion.div>
        </Tabs>
      </main>
    </motion.div>
  );
};

export default Dashboard;
