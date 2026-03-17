import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  fetchQuickCarts, 
  createQuickCart, 
  deleteQuickCart, 
  fetchTracks 
} from '@/db/api';
import { QuickCart, Track } from '../types/types';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Plus, Trash2, Play, Pause, Loader2, Music, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const QuickCartsManager: React.FC = () => {
  const [carts, setCarts] = useState<QuickCart[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [color, setColor] = useState('bg-primary');

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
    
    // কম্পোনেন্ট আনমাউন্ট হওয়ার সময় অডিও বন্ধ করা নিশ্চিত করা
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        window.dispatchEvent(new CustomEvent('radio-ducking', { detail: { active: false } }));
      }
    };
  }, []);


  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cartsData, tracksData] = await Promise.all([
        fetchQuickCarts(),
        fetchTracks()
      ]);
      setCarts(cartsData);
      setTracks(tracksData);
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
    window.dispatchEvent(new CustomEvent('radio-ducking', { detail: { active: false } }));
  };

  const playAudio = (cart: QuickCart) => {
    if (!audioRef.current) return;

    // যদি একই আইডি বাজতে থাকে, তবে তা পজ করা হবে এবং ডাকিং বন্ধ হবে
    if (playingId === cart.id) {
      audioRef.current.pause();
      setPlayingId(null);
      window.dispatchEvent(new CustomEvent('radio-ducking', { detail: { active: false } }));
      return;
    }

    try {
      // আগের বাজানো অডিও থামানো
      audioRef.current.pause();
      
      // নতুন অডিও সেট করা
      audioRef.current.src = cart.audio_url;
      audioRef.current.load();
      
      // ভলিউম সেট করা
      const savedVolume = localStorage.getItem('radio_volume');
      let vol = 0.7;
      try {
        if (savedVolume) {
          const parsed = JSON.parse(savedVolume);
          vol = (Array.isArray(parsed) ? parsed[0] : parsed) / 100;
        }
      } catch (e) {
        console.error('Failed to parse volume', e);
      }
      audioRef.current.volume = vol;
      
      setPlayingId(cart.id);
      
      // ডাকিং ইভেন্ট ডিসপ্যাচ করা হচ্ছে যাতে মূল রেডিও ভলিউম কমানো যায়
      window.dispatchEvent(new CustomEvent('radio-ducking', { detail: { active: true } }));
      
      audioRef.current.play().catch(err => {
        console.error('Playback failed', err);
        setPlayingId(null);
        window.dispatchEvent(new CustomEvent('radio-ducking', { detail: { active: false } }));
        toast.error('প্লেব্যাক শুরু করতে ব্যর্থ হয়েছে');
      });
    } catch (err) {
      console.error('Audio initialization failed', err);
      toast.error('অডিও লোড করতে সমস্যা হয়েছে');
    }
  };

  const handleAdd = async () => {
    if (!name || !selectedTrackId) {
      toast.error('নাম এবং অডিও নির্বাচন করুন');
      return;
    }

    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;

    setIsAdding(true);
    try {
      await createQuickCart({
        name,
        audio_url: track.audio_url,
        color,
        position: carts.length
      });
      toast.success('কুইককার্ট যুক্ত করা হয়েছে');
      setIsDialogOpen(false);
      setName('');
      setSelectedTrackId('');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('যোগ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;
    try {
      await deleteQuickCart(id);
      toast.success('মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const colors = [
    { name: 'Primary', class: 'bg-primary' },
    { name: 'Blue', class: 'bg-blue-600' },
    { name: 'Red', class: 'bg-red-600' },
    { name: 'Green', class: 'bg-green-600' },
    { name: 'Yellow', class: 'bg-yellow-600' },
    { name: 'Purple', class: 'bg-purple-600' },
    { name: 'Orange', class: 'bg-orange-600' },
    { name: 'Pink', class: 'bg-pink-600' },
  ];

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        hidden
      />
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              কুইককার্টস (QuickCarts)
            </CardTitle>
            <CardDescription>জিঙ্গেল ও সাউন্ড এফেক্ট দ্রুত প্লে করুন</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> নতুন কার্ট
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন কুইককার্ট যুক্ত করুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>নাম</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: স্টেশন আইডি ১" />
                </div>
                <div className="space-y-2">
                  <Label>অডিও ফাইল নির্বাচন করুন</Label>
                  <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                    <SelectTrigger>
                      <SelectValue placeholder="ফাইল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map(track => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.title} ({track.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>রঙ</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map(c => (
                      <button
                        key={c.class}
                        className={`h-8 rounded-md ${c.class} ${color === c.class ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        onClick={() => setColor(c.class)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleAdd} disabled={isAdding}>
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  যুক্ত করুন
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {carts.map((cart, index) => (
            <motion.div
              key={cart.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <Button
                onClick={() => playAudio(cart)}
                className={`w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all border-none ${cart.color || 'bg-primary'}`}
              >
                {playingId === cart.id ? <Pause className="w-8 h-8 animate-pulse" /> : <Play className="w-8 h-8" />}
                <span className="text-xs truncate w-full px-2">{cart.name}</span>
              </Button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(cart.id); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          {carts.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-muted-foreground italic">
              কোনো কুইককার্ট নেই। নতুন একটি যুক্ত করুন।
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};
