import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  fetchAdvertisementSchedules, 
  createAdvertisementSchedule, 
  updateAdvertisementSchedule, 
  deleteAdvertisementSchedule,
  fetchTracks,
  fetchPrograms,
  createTrack,
  deleteTrack
} from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Megaphone, Clock, Calendar, PlayCircle, Radio, Settings2, Info, Upload, Loader2, FileAudio } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AdvertisementSchedule, Track, Program } from '../types/types';

const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const AdvertisementManager: React.FC = () => {
  const [schedules, setSchedules] = useState<AdvertisementSchedule[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AdvertisementSchedule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [type, setType] = useState<'time' | 'interval' | 'program'>('time');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(15);
  const [programId, setProgramId] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sData, tData, pData] = await Promise.all([
        fetchAdvertisementSchedules(),
        fetchTracks('advertisement'),
        fetchPrograms()
      ]);
      setSchedules(sData);
      setTracks(tData);
      setPrograms(pData);
    } catch (err) {
      console.error(err);
      toast.error('বিজ্ঞাপন ডাটা লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const resetForm = () => {
    setName('');
    setTrackId('');
    setType('time');
    setStartTime('');
    setEndTime('');
    setIntervalMinutes(15);
    setProgramId('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setActive(true);
    setEditingSchedule(null);
  };

  const handleOpenDialog = (schedule?: AdvertisementSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setTrackId(schedule.track_id);
      setType(schedule.type);
      setStartTime(schedule.start_time || '');
      setEndTime(schedule.end_time || '');
      setIntervalMinutes(schedule.interval_minutes || 15);
      setProgramId(schedule.program_id || '');
      setSelectedDays(schedule.days_of_week);
      setActive(schedule.active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !trackId) {
      toast.error('নাম এবং বিজ্ঞাপনের ফাইল নির্বাচন করুন');
      return;
    }

    try {
      const scheduleData: Partial<AdvertisementSchedule> = {
        name,
        track_id: trackId,
        type,
        start_time: type === 'time' ? startTime : undefined,
        end_time: type === 'time' ? endTime : undefined,
        interval_minutes: type === 'interval' ? intervalMinutes : undefined,
        program_id: type === 'program' ? programId : undefined,
        days_of_week: selectedDays,
        active
      };

      if (editingSchedule) {
        await updateAdvertisementSchedule(editingSchedule.id, scheduleData);
        toast.success('বিজ্ঞাপন সিডিউল আপডেট করা হয়েছে');
      } else {
        await createAdvertisementSchedule(scheduleData);
        toast.success('বিজ্ঞাপন সিডিউল যুক্ত করা হয়েছে');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('বিজ্ঞাপন সিডিউল সংরক্ষণ করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই সিডিউলটি মুছে ফেলতে চান?')) return;
    try {
      await deleteAdvertisementSchedule(id);
      toast.success('বিজ্ঞাপন সিডিউল মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('সিডিউল মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileName = `advertisements/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tangail_radio_audio')
        .upload(fileName, file, {
          // @ts-ignore
          onUploadProgress: (progress: any) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tangail_radio_audio')
        .getPublicUrl(uploadData.path);

      await createTrack({
        title: file.name.replace(/\.[^/.]+$/, ""),
        audio_url: publicUrl,
        type: 'advertisement'
      });

      toast.success('বিজ্ঞাপন অডিও আপলোড করা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই বিজ্ঞাপন ফাইলটি মুছে ফেলতে চান?')) return;
    try {
      await deleteTrack(id);
      toast.success('বিজ্ঞাপন ফাইল মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black">বিজ্ঞাপন ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">রেডিওতে বিজ্ঞাপন প্রচারের সিডিউল তৈরি করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" /> নতুন সিডিউল
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'বিজ্ঞাপন সিডিউল সম্পাদনা' : 'নতুন বিজ্ঞাপন সিডিউল'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>সিডিউল নাম *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: দুপুর ১টার বিজ্ঞাপন" />
                </div>
                <div className="space-y-2">
                  <Label>বিজ্ঞাপন ফাইল (Track) *</Label>
                  <Select value={trackId} onValueChange={setTrackId}>
                    <SelectTrigger>
                      <SelectValue placeholder="ফাইল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map(track => (
                        <SelectItem key={track.id} value={track.id}>{track.title}</SelectItem>
                      ))}
                      {tracks.length === 0 && (
                        <div className="p-2 text-center text-xs text-muted-foreground italic">
                          কোনো বিজ্ঞাপন ফাইল নেই। প্রথমে ফাইল আপলোড করুন।
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>সিডিউল ধরণ</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">নির্দিষ্ট সময়ে (Scheduled Time)</SelectItem>
                    <SelectItem value="interval">বিরতি দিয়ে (Interval)</SelectItem>
                    <SelectItem value="program">অনুষ্ঠানে (Program Based)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>প্রচার শুরু</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2 text-muted-foreground flex flex-col justify-end">
                    <p className="text-[10px] italic">টিপস: নির্দিষ্ট সময়ে বিজ্ঞাপনটি স্বয়ংক্রিয়ভাবে প্রচার হবে।</p>
                  </div>
                </div>
              )}

              {type === 'interval' && (
                <div className="space-y-2">
                  <Label>প্রতি কত মিনিট পর পর? (মিনিট)</Label>
                  <Input type="number" value={intervalMinutes} onChange={(e) => setIntervalMinutes(Number(e.target.value))} />
                  <p className="text-[10px] text-muted-foreground italic">যেমন: ১৫ মিনিট পর পর প্রচার করতে ১৫ লিখুন।</p>
                </div>
              )}

              {type === 'program' && (
                <div className="space-y-2">
                  <Label>অনুষ্ঠান নির্বাচন করুন</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="অনুষ্ঠান সিলেক্ট করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">বিজ্ঞাপনটি নির্বাচিত অনুষ্ঠানের সময় ১৫ মিনিট পর পর বাজবে।</p>
                </div>
              )}

              <div className="space-y-2">
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
        {schedules.map((schedule, index) => (
          <motion.div key={schedule.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className={schedule.active ? '' : 'opacity-50'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">{schedule.name}</h3>
                        <p className="text-sm text-muted-foreground">ফাইল: {schedule.track?.title || 'ফাইল পাওয়া যায়নি'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded">
                        <Settings2 className="w-3.5 h-3.5" />
                        {schedule.type === 'time' ? 'নির্দিষ্ট সময়' : schedule.type === 'interval' ? 'বিরতি' : 'অনুষ্ঠান ভিত্তিক'}
                      </div>
                      
                      {schedule.type === 'time' && schedule.start_time && (
                        <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {schedule.start_time}
                        </div>
                      )}
                      
                      {schedule.type === 'interval' && schedule.interval_minutes && (
                        <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          প্রতি {schedule.interval_minutes} মিনিট
                        </div>
                      )}

                      {schedule.type === 'program' && schedule.program_id && (
                        <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                          <Radio className="w-3.5 h-3.5" />
                          অনুষ্ঠান: {programs.find(p => p.id === schedule.program_id)?.title || 'লোডিং...'}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded italic">
                        <Calendar className="w-3.5 h-3.5" />
                        {schedule.days_of_week.length === 7 ? 'প্রতিদিন' : schedule.days_of_week.map(d => bengaliDays[d].substring(0, 3)).join(', ')}
                      </div>

                      {schedule.last_played_at && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded">
                          <Info className="w-3.5 h-3.5" />
                          শেষ বার: {new Date(schedule.last_played_at).toLocaleTimeString('bn-BD')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(schedule)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {schedules.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো বিজ্ঞাপন সিডিউল নেই। নতুন বিজ্ঞাপন যুক্ত করুন।</p>
              <Button variant="outline" size="sm" onClick={() => handleOpenDialog()} className="mt-4">
                নতুন সিডিউল তৈরি করুন
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ad Files Management Section */}
      <div className="space-y-6 pt-12 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">বিজ্ঞাপন অডিও ফাইলসমূহ</h2>
            <p className="text-sm text-muted-foreground">রেডিওতে প্রচারের জন্য বিজ্ঞাপনের অডিও ফাইল আপলোড করুন</p>
          </div>
          <Button asChild disabled={isUploading} className="gap-2">
            <label className="cursor-pointer">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              অডিও আপলোড
              <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
            </label>
          </Button>
        </div>

        {isUploading && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">আপলোড হচ্ছে...</span>
                <span className="text-sm font-bold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map(track => (
            <Card key={track.id} className="group overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{track.title}</h4>
                    <p className="text-[10px] text-muted-foreground">ID: {track.id.substring(0, 8)}...</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteTrack(track.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tracks.length === 0 && !isUploading && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <FileAudio className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>কোনো বিজ্ঞাপন অডিও ফাইল নেই</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
