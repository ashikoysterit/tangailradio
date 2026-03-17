import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  fetchPrograms, 
  createProgram, 
  updateProgram, 
  deleteProgram 
} from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Radio, Image as ImageIcon, Upload, Loader2, Calendar, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Program } from '../types/types';

const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const ProgramsManager: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // ফর্ম স্টেট
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hostName, setHostName] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [active, setActive] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileName = `programs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

      const { data, error } = await supabase.storage
        .from('tangail_radio_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          // @ts-ignore
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('tangail_radio_images')
        .getPublicUrl(data.path);

      setImageUrl(publicUrl);
      toast.success('ছবি আপলোড করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const loadData = async () => {
    try {
      const data = await fetchPrograms();
      setPrograms(data);
    } catch (err) {
      console.error(err);
      toast.error('অনুষ্ঠান লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setHostName('');
    setScheduleTime('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setActive(true);
    setEditingProgram(null);
  };

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setTitle(program.title);
      setDescription(program.description || '');
      setImageUrl(program.image_url || '');
      setHostName(program.host_name || '');
      setScheduleTime(program.schedule_time || '');
      setSelectedDays(program.days_of_week);
      setActive(program.active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title) {
      toast.error('অনুষ্ঠানের নাম দিন');
      return;
    }

    try {
      const programData = {
        title,
        description: description || undefined,
        image_url: imageUrl || undefined,
        host_name: hostName || undefined,
        schedule_time: scheduleTime || undefined,
        days_of_week: selectedDays,
        active
      };

      if (editingProgram) {
        await updateProgram(editingProgram.id, programData);
        toast.success('অনুষ্ঠান আপডেট করা হয়েছে');
      } else {
        await createProgram(programData);
        toast.success('অনুষ্ঠান যুক্ত করা হয়েছে');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('অনুষ্ঠান সংরক্ষণ করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই অনুষ্ঠানটি মুছে ফেলতে চান?')) return;
    try {
      await deleteProgram(id);
      toast.success('অনুষ্ঠান মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('অনুষ্ঠান মুছে ফেলতে ব্যর্থ হয়েছে');
    }
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
          <h2 className="text-2xl font-black">অনুষ্ঠানমালা ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">রেডিও অনুষ্ঠানের বিস্তারিত তথ্য যুক্ত করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" /> নতুন অনুষ্ঠান
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'অনুষ্ঠান সম্পাদনা' : 'নতুন অনুষ্ঠান যুক্ত করুন'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>অনুষ্ঠানের নাম *</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="যেমন: সকালের আসর"
                />
              </div>

              <div>
                <Label>বিবরণ</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="অনুষ্ঠান সম্পর্কে বিস্তারিত লিখুন..."
                  rows={4}
                />
              </div>

              <div>
                <Label>উপস্থাপক</Label>
                <Input 
                  value={hostName} 
                  onChange={(e) => setHostName(e.target.value)} 
                  placeholder="উপস্থাপকের নাম"
                />
              </div>

              <div>
                <Label>অনুষ্ঠানের ছবি আপলোড</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative group w-32 h-24 rounded-xl overflow-hidden shadow-lg">
                        <img src={imageUrl} alt="Program Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImageUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-24 border-2 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center bg-muted/30">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="h-10 cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        পরামর্শ: উচ্চ রেজোলিউশনের ল্যান্ডস্কেপ ছবি (16:9) ব্যবহার করুন।
                      </p>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>আপলোড হচ্ছে...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>ছবির URL (ঐচ্ছিক)</Label>
                <Input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label>সম্প্রচার সময়</Label>
                <Input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={(e) => setScheduleTime(e.target.value)} 
                />
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

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={active}
                  onCheckedChange={(checked) => setActive(checked as boolean)}
                />
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
        {programs.map((program, index) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={program.active ? '' : 'opacity-50'}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {program.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-black">{program.title}</h3>
                        {program.host_name && (
                          <p className="text-sm text-muted-foreground">উপস্থাপক: {program.host_name}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(program)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(program.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {program.description && (
                      <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {program.schedule_time && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                          সময়: {program.schedule_time}
                        </span>
                      )}
                      {program.days_of_week.length > 0 && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {program.days_of_week.map((d: number) => bengaliDays[d]).join(', ')}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${program.active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {program.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {programs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো অনুষ্ঠান নেই। নতুন অনুষ্ঠান যুক্ত করুন।</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
