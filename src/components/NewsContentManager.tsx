import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchTracks, createTrack, updateTrack, deleteTrack } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Upload, Trash2, Play, Pause, Loader2, Music, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url: string;
  intro_url?: string;
  duration?: number;
  type?: string;
  scheduled_time?: string;
  created_at: string;
}

export const NewsContentManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ফর্ম স্টেট
  const [title, setTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [newsFile, setNewsFile] = useState<File | null>(null);
  const [introFile, setIntroFile] = useState<File | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const allTracks = await fetchTracks();
      const newsItems = allTracks.filter(t => t.type === 'news');
      setTracks(newsItems);
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('সংবাদ লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, bucketName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('শিরোনাম লিখুন');
      return;
    }

    if (!newsFile) {
      toast.error('সংবাদ অডিও ফাইল নির্বাচন করুন');
      return;
    }

    setUploading(true);
    try {
      // আপলোড সংবাদ অডিও
      const newsUrl = await handleFileUpload(newsFile, 'tangail_radio_audio');
      if (!newsUrl) {
        toast.error('সংবাদ অডিও আপলোড ব্যর্থ হয়েছে');
        return;
      }

      // আপলোড ইন্ট্রো (যদি থাকে)
      let introUrl: string | undefined = undefined;
      if (introFile) {
        introUrl = await handleFileUpload(introFile, 'tangail_radio_audio') || undefined;
      }

      // ডাটাবেসে সংরক্ষণ করুন
      await createTrack({
        title,
        audio_url: newsUrl,
        intro_url: introUrl,
        type: 'news',
        scheduled_time: scheduledTime || undefined,
        artist: 'Tangail Radio'
      });

      toast.success('সংবাদ সফলভাবে যুক্ত হয়েছে');
      
      // রিসেট ফর্ম
      setTitle('');
      setScheduledTime('');
      setNewsFile(null);
      setIntroFile(null);
      
      // রিলোড তালিকা
      loadNews();
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('সংবাদ যুক্ত করতে ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি এই সংবাদটি মুছে ফেলতে চান?')) return;
    
    try {
      await deleteTrack(id);
      toast.success('সংবাদ মুছে ফেলা হয়েছে');
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>সংবাদ ম্যানেজমেন্ট</CardTitle>
        <CardDescription>
          সংবাদ অডিও এবং ইন্ট্রো আপলোড করুন এবং শিডিউল করুন
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* আপলোড ফর্ম */}
        <div className="border rounded-xl p-6 bg-muted/5 space-y-4">
          <h3 className="font-bold text-lg mb-4">নতুন সংবাদ যুক্ত করুন</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>সংবাদের শিরোনাম *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: সন্ধ্যা ৬টার সংবাদ"
              />
            </div>

            <div className="space-y-2">
              <Label>শিডিউল সময় (ঐচ্ছিক)</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                নির্দিষ্ট সময়ে স্বয়ংক্রিয়ভাবে প্লে হবে
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>সংবাদ অডিও ফাইল *</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById('news_audio_input')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {newsFile ? newsFile.name : 'ফাইল নির্বাচন করুন'}
                </Button>
                <input
                  id="news_audio_input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setNewsFile(e.target.files?.[0] || null)}
                />
                {newsFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNewsFile(null)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ইন্ট্রো অডিও (ঐচ্ছিক)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById('intro_audio_input')?.click()}
                >
                  <Music className="w-4 h-4 mr-2" />
                  {introFile ? introFile.name : 'ইন্ট্রো নির্বাচন করুন'}
                </Button>
                <input
                  id="intro_audio_input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setIntroFile(e.target.files?.[0] || null)}
                />
                {introFile && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIntroFile(null)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                সংবাদের আগে ইন্ট্রো প্লে হবে
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                আপলোড হচ্ছে...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                সংবাদ যুক্ত করুন
              </>
            )}
          </Button>
        </div>

        {/* সংবাদ তালিকা */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg">সংবাদ তালিকা ({tracks.length}টি)</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              কোনো সংবাদ নেই। নতুন সংবাদ যুক্ত করুন।
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold">{track.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {track.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {track.scheduled_time}
                          </span>
                        )}
                        {track.intro_url && (
                          <span className="flex items-center gap-1 text-primary">
                            <Music className="w-3 h-3" />
                            ইন্ট্রো আছে
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const audio = new Audio(track.audio_url);
                          audio.play();
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(track.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
