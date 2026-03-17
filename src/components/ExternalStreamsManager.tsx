import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  fetchExternalStreams, 
  createExternalStream, 
  updateExternalStream, 
  deleteExternalStream,
  forcePlayExternalStream,
  stopExternalStream,
  getRadioSession
} from '@/db/api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Radio, ExternalLink, PlayCircle, Zap, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ExternalStream {
  id: string;
  name: string;
  stream_url: string;
  schedule_time?: string;
  end_time?: string;
  days_of_week: number[];
  active: boolean;
  created_at: string;
}

const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const ExternalStreamsManager: React.FC = () => {
  const [streams, setStreams] = useState<ExternalStream[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<ExternalStream | null>(null);

  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [active, setActive] = useState(true);
  const [now, setNow] = useState(new Date());
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    checkCurrentPlaying();
    const timer = setInterval(() => {
      setNow(new Date());
      checkCurrentPlaying();
    }, 15000); 
    return () => clearInterval(timer);
  }, []);

  const checkCurrentPlaying = async () => {
    try {
      const session = await getRadioSession();
      if (session && session.current_track_type === 'external_stream') {
        setCurrentPlayingId(session.current_track_id);
      } else {
        setCurrentPlayingId(null);
      }
    } catch (err) {
      console.error("Error checking playing track:", err);
    }
  };

  const isStreamCurrentlyLive = (stream: ExternalStream) => {
    if (!stream.active || !stream.schedule_time || !stream.end_time) return false;
    
    const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const day = bdTime.getDay();
    if (!stream.days_of_week.includes(day)) return false;
    
    const [sh, sm] = stream.schedule_time.split(':').map(Number);
    const [eh, em] = stream.end_time.split(':').map(Number);
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;
    
    const currentH = bdTime.getHours();
    const currentM = bdTime.getMinutes();
    const currentTotal = currentH * 60 + currentM;
    
    return currentTotal >= startTotal && currentTotal < endTotal;
  };

  const loadData = async () => {
    try {
      const data = await fetchExternalStreams();
      setStreams(data);
    } catch (err) {
      console.error(err);
      toast.error('স্ট্রিম লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const resetForm = () => {
    setName('');
    setStreamUrl('');
    setScheduleTime('');
    setEndTime('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setActive(true);
    setEditingStream(null);
  };

  const handleOpenDialog = (stream?: ExternalStream) => {
    if (stream) {
      setEditingStream(stream);
      setName(stream.name);
      setStreamUrl(stream.stream_url);
      setScheduleTime(stream.schedule_time || '');
      setEndTime(stream.end_time || '');
      setSelectedDays(stream.days_of_week);
      setActive(stream.active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !streamUrl) {
      toast.error('নাম এবং স্ট্রিম URL দিন');
      return;
    }

    try {
      const streamData = {
        name,
        stream_url: streamUrl,
        schedule_time: scheduleTime || undefined,
        end_time: endTime || undefined,
        days_of_week: selectedDays,
        active
      };

      if (editingStream) {
        await updateExternalStream(editingStream.id, streamData);
        toast.success('স্ট্রিম আপডেট করা হয়েছে');
      } else {
        await createExternalStream(streamData);
        toast.success('স্ট্রিম যুক্ত করা হয়েছে');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('স্ট্রিম সংরক্ষণ করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই স্ট্রিমটি মুছে ফেলতে চান?')) return;
    try {
      await deleteExternalStream(id);
      toast.success('স্ট্রিম মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('স্ট্রিম মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const handleInstantPlay = async (stream: ExternalStream) => {
    try {
      await forcePlayExternalStream({
        id: stream.id,
        name: stream.name,
        stream_url: stream.stream_url
      });
      toast.success(`${stream.name} রেডিও প্লেয়ারে ইনস্ট্যান্ট প্লে করা হয়েছে`);
      setCurrentPlayingId(stream.id);
    } catch (err) {
      console.error(err);
      toast.error('ইনস্ট্যান্ট প্লে শুরু করতে সমস্যা হয়েছে');
    }
  };

  const handleInstantStop = async () => {
    try {
      await stopExternalStream();
      toast.success('বাহ্যিক স্ট্রিম বন্ধ করা হয়েছে এবং অটো ডিজে পুনরায় শুরু হয়েছে');
      setCurrentPlayingId(null);
    } catch (err) {
      console.error(err);
      toast.error('স্ট্রিম বন্ধ করতে সমস্যা হয়েছে');
    }
  };

  const addDemoLink = () => {
    setName('বিবিসি ওয়ার্ল্ড সার্ভিস (ডেমো)');
    setStreamUrl('https://stream.live.vc.bbcmedia.co.uk/bbc_world_service');
    toast.info('ডেমো লিংক যুক্ত করা হয়েছে');
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">বাহ্যিক স্ট্রিম ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">অন্য রেডিও স্টেশনের স্ট্রিম যুক্ত করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" /> নতুন স্ট্রিম
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStream ? 'স্ট্রিম সম্পাদনা' : 'নতুন স্ট্রিম যুক্ত করুন'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>স্ট্রিমের নাম *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: BBC Radio" />
              </div>

              <div>
                <Label>স্ট্রিম URL *</Label>
                <div className="flex gap-2">
                  <Input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://stream.example.com/radio.mp3" className="flex-1" />
                  <Button type="button" variant="secondary" size="sm" onClick={addDemoLink} className="shrink-0">
                    ডেমো স্টেশান
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>শুরুর সময়</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
                <div>
                  <Label>শেষ সময়</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">সপ্তাহের দিন</Label>
                <div className="flex flex-wrap gap-2">
                  {bengaliDays.map((day, index) => (
                    <Button key={index} type="button" variant={selectedDays.includes(index) ? 'default' : 'outline'} size="sm" onClick={() => toggleDay(index)}>
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked as boolean)} />
                <Label>সক্রিয় করুন</Label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleSave}>সংরক্ষণ করুন</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {streams.map((stream, index) => (
          <motion.div key={stream.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className={stream.active ? '' : 'opacity-50'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-primary" />
                      {stream.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 break-all">{stream.stream_url}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {stream.schedule_time && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                          {stream.schedule_time} - {stream.end_time || 'শেষ পর্যন্ত'}
                        </span>
                      )}
                      {isStreamCurrentlyLive(stream) && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-black animate-pulse">
                          LIVE
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${stream.active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {stream.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {currentPlayingId === stream.id ? (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleInstantStop}
                        className="gap-2"
                      >
                        <Square className="w-4 h-4 fill-current" /> এখনই বন্ধ
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleInstantPlay(stream)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Zap className="w-4 h-4 fill-current" /> এখনই বাজান
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(stream)} className="flex-1">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(stream.id)} className="flex-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {streams.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো স্ট্রিম নেই। নতুন স্ট্রিম যুক্ত করুন।</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
