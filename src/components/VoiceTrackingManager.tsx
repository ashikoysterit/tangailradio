import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchTracks, createTrack, deleteTrack } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Upload, 
  Loader2, 
  Music, 
  User, 
  Clock,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../types/types';

export const VoiceTrackingManager: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ফর্ম স্টেট
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    loadVoiceTracks();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadVoiceTracks = async () => {
    setLoading(true);
    try {
      const allTracks = await fetchTracks('voiceover');
      setTracks(allTracks);
    } catch (error) {
      console.error('Error loading voice tracks:', error);
      toast.error('ভয়েস ট্র্যাক লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File | Blob, bucketName: string, originalName?: string): Promise<string | null> => {
    try {
      const fileExt = originalName ? originalName.split('.').pop() : 'webm';
      const fileName = `voicetracking_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setAudioFile(null); // Clear manual file if we have a recording
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('মাইক্রোফোন অ্যাক্সেস করতে ব্যর্থ হয়েছে');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('ভয়েস ট্র্যাকিং টাইটেল লিখুন');
      return;
    }

    if (!audioFile && !recordedBlob) {
      toast.error('অডিও ফাইল আপলোড করুন অথবা রেকর্ড করুন');
      return;
    }

    setUploading(true);
    try {
      let audioUrl: string | null = null;
      if (recordedBlob) {
        audioUrl = await handleFileUpload(recordedBlob, 'tangail_radio_audio', 'recording.webm');
      } else if (audioFile) {
        audioUrl = await handleFileUpload(audioFile, 'tangail_radio_audio', audioFile.name);
      }

      if (!audioUrl) {
        toast.error('অডিও আপলোড ব্যর্থ হয়েছে');
        return;
      }

      await createTrack({
        title,
        audio_url: audioUrl,
        type: 'voiceover',
        scheduled_time: scheduledTime || undefined,
        artist: host || 'Presenter'
      });

      toast.success('ভয়েস ট্র্যাকিং সফলভাবে যুক্ত হয়েছে');
      
      // রিসেট ফর্ম
      setTitle('');
      setHost('');
      setScheduledTime('');
      setAudioFile(null);
      setRecordedBlob(null);
      setRecordDuration(0);
      
      // রিলোড তালিকা
      loadVoiceTracks();
    } catch (error) {
      console.error('Error creating voice track:', error);
      toast.error('যুক্ত করতে ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি এই ভয়েস ট্র্যাকটি মুছে ফেলতে চান?')) return;
    
    try {
      await deleteTrack(id);
      toast.success('মুছে ফেলা হয়েছে');
      loadVoiceTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          ভয়েস ট্র্যাকিং (Voice Tracking)
        </CardTitle>
        <CardDescription>
          প্রেজেন্টার সেগমেন্ট রেকর্ড করুন এবং প্লে আউটে নির্বিঘ্নে যুক্ত করুন
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* রেকর্ড ও আপলোড ফর্ম */}
        <div className="border rounded-2xl p-6 bg-muted/5 space-y-6">
          <h3 className="font-bold text-lg mb-2">নতুন সেগমেন্ট তৈরি করুন</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>সেগমেন্ট টাইটেল *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: সন্ধ্যার ঘোষণা"
              />
            </div>

            <div className="space-y-2">
              <Label>প্রেজেন্টার নাম</Label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="প্রেজেন্টারের নাম"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>শিডিউল সময় (ঐচ্ছিক)</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              নির্দিষ্ট সময়ে প্লে করতে চাইলে সময় দিন, অথবা অটোমেটিক রোটেশনে চলবে
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* রেকর্ডিং সেকশন */}
            <div className="space-y-3 p-4 border rounded-xl bg-background/50">
              <Label className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-primary" /> সরাসরি রেকর্ড করুন
              </Label>
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    className="flex-1 rounded-full gap-2"
                    variant="outline"
                  >
                    <Mic className="w-4 h-4 text-red-500" /> রেকর্ড শুরু করুন
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording} 
                    className="flex-1 rounded-full gap-2 animate-pulse"
                    variant="destructive"
                  >
                    <Square className="w-4 h-4" /> রেকর্ড বন্ধ করুন ({formatDuration(recordDuration)})
                  </Button>
                )}
                {recordedBlob && !isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">রেকর্ড হয়েছে</div>
                    <Button variant="ghost" size="icon" onClick={() => setRecordedBlob(null)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                )}
              </div>
            </div>

            {/* আপলোড সেকশন */}
            <div className="space-y-3 p-4 border rounded-xl bg-background/50">
              <Label className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-primary" /> অডিও ফাইল আপলোড
              </Label>
              <div className="flex items-center gap-4">
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1 rounded-full"
                  disabled={isRecording}
                >
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {audioFile ? audioFile.name : 'ফাইল নির্বাচন করুন'}
                    <input 
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => {
                        setAudioFile(e.target.files?.[0] || null);
                        setRecordedBlob(null);
                      }}
                    />
                  </label>
                </Button>
                {audioFile && (
                  <Button variant="ghost" size="icon" onClick={() => setAudioFile(null)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading || isRecording}
            className="w-full rounded-full shadow-lg h-12 text-lg font-bold transition-all hover:scale-[1.01]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                সংরক্ষণ করা হচ্ছে...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                ভয়েস ট্র্যাক সংরক্ষণ করুন
              </>
            )}
          </Button>
        </div>

        {/* ট্র্যাক তালিকা */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl">ভয়েস ট্র্যাক তালিকা ({tracks.length}টি)</h3>
            <Button variant="outline" size="sm" onClick={loadVoiceTracks}><Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ</Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground italic bg-muted/5">
              এখনও কোনো ভয়েস ট্র্যাক যুক্ত করা হয়নি। শুরু করতে রেকর্ড করুন বা আপলোড করুন।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {tracks.map((track) => (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group p-4 border rounded-2xl bg-card hover:border-primary/50 transition-all shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <Mic className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => {
                              const audio = new Audio(track.audio_url);
                              audio.play();
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(track.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-bold truncate" title={track.title}>{track.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <User className="w-3 h-3" /> {track.artist || 'Presenter'}
                        </div>
                        {track.scheduled_time && (
                          <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                            <Clock className="w-3 h-3" /> {track.scheduled_time}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
