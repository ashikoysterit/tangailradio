import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  fetchPlaylistSchedules, 
  createPlaylistSchedule, 
  updatePlaylistSchedule, 
  deletePlaylistSchedule,
  fetchTracks 
} from '@/db/api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlaylistSchedule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  track_ids: string[];
  days_of_week: number[];
  active: boolean;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url: string;
  duration?: number;
  type?: string;
  scheduled_time?: string;
  created_at: string;
}

const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const ScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<PlaylistSchedule[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PlaylistSchedule | null>(null);

  // ফর্ম স্টেট
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesData, tracksData] = await Promise.all([
        fetchPlaylistSchedules(),
        fetchTracks()
      ]);
      setSchedules(schedulesData);
      setTracks(tracksData);
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const resetForm = () => {
    setName('');
    setStartTime('');
    setEndTime('');
    setSelectedTracks([]);
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setActive(true);
    setEditingSchedule(null);
  };

  const handleOpenDialog = (schedule?: PlaylistSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.start_time);
      setEndTime(schedule.end_time);
      setSelectedTracks(schedule.track_ids);
      setSelectedDays(schedule.days_of_week);
      setActive(schedule.active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !startTime || !endTime || selectedTracks.length === 0) {
      toast.error('সকল ফিল্ড পূরণ করুন');
      return;
    }

    try {
      const scheduleData = {
        name,
        start_time: startTime,
        end_time: endTime,
        track_ids: selectedTracks,
        days_of_week: selectedDays,
        active
      };

      if (editingSchedule) {
        await updatePlaylistSchedule(editingSchedule.id, scheduleData);
        toast.success('শিডিউল আপডেট করা হয়েছে');
      } else {
        await createPlaylistSchedule(scheduleData);
        toast.success('শিডিউল যুক্ত করা হয়েছে');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('শিডিউল সংরক্ষণ করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই শিডিউলটি মুছে ফেলতে চান?')) return;
    try {
      await deletePlaylistSchedule(id);
      toast.success('শিডিউল মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('শিডিউল মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">প্লেলিস্ট শিডিউল ম্যানেজার</h2>
          <p className="text-sm text-muted-foreground">সময় অনুযায়ী প্লেলিস্ট শিডিউল করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" /> নতুন শিডিউল
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'শিডিউল সম্পাদনা' : 'নতুন শিডিউল যুক্ত করুন'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>শিডিউলের নাম</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="যেমন: সকালের প্লেলিস্ট"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>শুরুর সময়</Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                  />
                </div>
                <div>
                  <Label>শেষ সময়</Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">সপ্তাহের দিন</Label>
                <div className="flex flex-wrap gap-2">
                  {bengaliDays.map((day, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedDays.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(index)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">গান নির্বাচন করুন ({selectedTracks.length} টি নির্বাচিত)</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {tracks.map(track => (
                    <div key={track.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTracks.includes(track.id)}
                        onCheckedChange={() => toggleTrack(track.id)}
                      />
                      <span className="text-sm">{track.title} - {track.artist}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={active}
                  onCheckedChange={(checked) => setActive(checked as boolean)}
                />
                <Label>সক্রিয় করুন</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleSave}>সংরক্ষণ করুন</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={schedule.active ? '' : 'opacity-50'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{schedule.start_time} - {schedule.end_time}</span>
                      </div>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {schedule.days_of_week.sort((a: number, b: number) => a - b).map((day: number) => (
                      <span key={day} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {bengaliDays[day]}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.track_ids.length} টি গান • {schedule.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {schedules.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো শিডিউল নেই। নতুন শিডিউল যুক্ত করুন।</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
