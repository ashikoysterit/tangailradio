import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchTimeAnnouncements, updateTimeAnnouncement } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Upload, Clock, Loader2, Play, Music, CheckCircle2, Sun, Sunset, Moon, Sunrise, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TIME_PERIODS = [
  { id: 'morning', name: 'সকাল', icon: Sunrise, hours: [6, 7, 8, 9, 10, 11] },
  { id: 'noon', name: 'দুপুর', icon: Sun, hours: [12, 13, 14, 15] },
  { id: 'afternoon', name: 'বিকেল', icon: Sunset, hours: [16, 17] },
  { id: 'evening', name: 'সন্ধ্যা', icon: Coffee, hours: [18, 19] },
  { id: 'night', name: 'রাত', icon: Moon, hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5] },
];

export const TimeAnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingHour, setUploadingHour] = useState<number | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchTimeAnnouncements();
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading time announcements:', error);
      toast.error('সময় এনাউন্সমেন্ট লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (hour: number, file: File) => {
    try {
      setUploadingHour(hour);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `time_announcement_${hour}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tangail_radio_audio')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('tangail_radio_audio')
        .getPublicUrl(filePath);

      await updateTimeAnnouncement(hour, urlData.publicUrl);
      
      toast.success(`${hour}:00 এর জন্য অডিও আপলোড সফল হয়েছে`);
      loadAnnouncements();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`আপলোড ব্যর্থ হয়েছে: ${error.message}`);
    } finally {
      setUploadingHour(null);
    }
  };

  const getAudioForHour = (hour: number) => {
    return announcements.find((a) => a.hour === hour);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ঘড়ির সময় এনাউন্সমেন্ট</h2>
          <p className="text-muted-foreground">প্রত্যেক ঘন্টার জন্য আলাদা অডিও আপলোড করুন (০-২৩ ঘন্টা)</p>
        </div>
      </div>

      <Tabs defaultValue="morning" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-wrap gap-2">
          {TIME_PERIODS.map((period) => (
            <TabsTrigger
              key={period.id}
              value={period.id}
              className="flex-1 py-3 px-6 rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              <period.icon className="w-4 h-4" />
              {period.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {TIME_PERIODS.map((period) => (
          <TabsContent key={period.id} value={period.id} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {period.hours.map((hour, idx) => {
                const announcement = getAudioForHour(hour);
                const isUploading = uploadingHour === hour;

                return (
                  <motion.div
                    key={hour}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card className={`relative overflow-hidden transition-all duration-300 border-2 ${announcement ? 'border-primary/20 bg-primary/5' : 'border-dashed border-muted'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            {hour < 10 ? `০${hour}` : hour}:০০ {hour < 12 ? 'সকাল' : (hour < 16 ? 'দুপুর' : (hour < 18 ? 'বিকেল' : (hour < 20 ? 'সন্ধ্যা' : 'রাত')))}
                          </CardTitle>
                          {announcement && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {announcement ? (
                          <div className="flex items-center gap-2">
                            <audio src={announcement.audio_url} className="hidden" id={`audio-${hour}`} />
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full gap-2"
                              onClick={() => {
                                const audio = document.getElementById(`audio-${hour}`) as HTMLAudioElement;
                                audio.play();
                              }}
                            >
                              <Play className="w-4 h-4" /> শুনুন
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground italic text-sm">
                            <Music className="w-8 h-8 opacity-20 mb-2" />
                            অডিও নেই
                          </div>
                        )}

                        <div className="relative">
                          <Input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            id={`file-${hour}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(hour, file);
                            }}
                            disabled={isUploading}
                          />
                          <Label
                            htmlFor={`file-${hour}`}
                            className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md cursor-pointer transition-all ${
                              isUploading
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> আপলোড হচ্ছে...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" /> {announcement ? 'পরিবর্তন করুন' : 'আপলোড করুন'}
                              </>
                            )}
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
