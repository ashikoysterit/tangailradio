import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  fetchClocks, 
  createClock, 
  deleteClock, 
  updateClockItems, 
  fetchPlaylists,
  fetchTracks 
} from '@/db/api';
import { Clock, ClockItem, Playlist, Track } from '../types/types';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Loader2, Music, Clock as ClockIcon, Save, X, ListOrdered } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
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

export const ClockManager: React.FC = () => {
  const [clocks, setClocks] = useState<(Clock & { clock_items: ClockItem[] })[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Create Clock Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Edit Clock Form
  const [editingClock, setEditingClock] = useState<(Clock & { clock_items: ClockItem[] }) | null>(null);
  const [editedItems, setEditedItems] = useState<Partial<ClockItem>[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clocksData, playlistsData, tracksData] = await Promise.all([
        fetchClocks(),
        fetchPlaylists(),
        fetchTracks()
      ]);
      setClocks(clocksData);
      setPlaylists(playlistsData);
      setTracks(tracksData);
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      toast.error('নাম লিখুন');
      return;
    }
    try {
      await createClock(name, description);
      toast.success('ক্লক টেমপ্লেট তৈরি করা হয়েছে');
      setIsDialogOpen(false);
      setName(''); setDescription('');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;
    try {
      await deleteClock(id);
      toast.success('মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const openEditDialog = (clock: Clock & { clock_items: ClockItem[] }) => {
    setEditingClock(clock);
    setEditedItems(clock.clock_items || []);
    setIsEditDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!editingClock) return;
    const lastItem = editedItems[editedItems.length - 1];
    const startMinute = lastItem?.end_minute ?? 0;
    
    if (startMinute >= 60) {
      toast.error('ক্লক পূর্ণ হয়ে গেছে');
      return;
    }

    const newItem: Partial<ClockItem> = {
      clock_id: editingClock.id,
      start_minute: startMinute as number,
      end_minute: Math.min((startMinute as number) + 15, 60),
      item_type: 'song'
    };
    setEditedItems([...editedItems, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = [...editedItems];
    newItems.splice(index, 1);
    
    // Auto-adjust subsequent items
    let currentMin = 0;
    const adjusted = newItems.map(item => {
      const duration = (item.end_minute as number) - (item.start_minute as number);
      const start = currentMin;
      const end = Math.min(start + duration, 60);
      currentMin = end;
      return { ...item, start_minute: start, end_minute: end };
    });
    
    setEditedItems(adjusted);
  };

  const updateItem = (index: number, updates: Partial<ClockItem>) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], ...updates };
    
    // If end_minute changed, adjust subsequent items
    if (updates.end_minute !== undefined) {
      let currentMin = updates.end_minute as number;
      for (let i = index + 1; i < newItems.length; i++) {
        const duration = (newItems[i].end_minute as number) - (newItems[i].start_minute as number);
        newItems[i].start_minute = currentMin;
        newItems[i].end_minute = Math.min(currentMin + duration, 60);
        currentMin = newItems[i].end_minute as number;
      }
    }

    setEditedItems(newItems);
  };

  const handleSaveItems = async () => {
    if (!editingClock) return;
    try {
      await updateClockItems(editingClock.id, editedItems);
      toast.success('ক্লক টেমপ্লেট সেভ করা হয়েছে');
      setIsEditDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-primary" />
              ক্লক ম্যানেজার (Clock Manager)
            </CardTitle>
            <CardDescription>এক ঘন্টার প্রোগ্রাম টেমপ্লেট তৈরি করুন</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> নতুন ক্লক
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন ক্লক টেমপ্লেট তৈরি করুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>ক্লকের নাম</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: সকালের টেমপ্লেট" />
                </div>
                <div className="space-y-2">
                  <Label>বিবরণ (ঐচ্ছিক)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="ক্লকের বিবরণ" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleCreate}>তৈরি করুন</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clocks.map((clock, index) => (
            <motion.div
              key={clock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary transition-colors border-dashed bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{clock.name}</CardTitle>
                      <CardDescription className="text-xs">{clock.description || 'কোনো বিবরণ নেই'}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEditDialog(clock)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(clock.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex shadow-inner">
                    {clock.clock_items?.map((item, idx) => {
                      const width = ((item.end_minute - item.start_minute) / 60) * 100;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      return (
                        <div
                          key={item.id}
                          className={`h-full ${colors[idx % colors.length]}`}
                          style={{ width: `${width}%` }}
                          title={`${item.item_type}: ${item.start_minute}-${item.end_minute}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>0:00</span>
                    <span>60:00</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {clocks.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/10 rounded-xl border-2 border-dashed">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>কোনো ক্লক টেমপ্লেট নেই। নতুন একটি তৈরি করুন।</p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>ক্লক সম্পাদনা: {editingClock?.name}</DialogTitle>
            <CardDescription>এক ঘন্টার সময়সূচী সাজান (মিনিট অনুযায়ী)</CardDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="relative w-full h-12 bg-muted rounded-lg flex overflow-hidden shadow-inner border">
               {editedItems.map((item, idx) => {
                  const width = (((item.end_minute || 0) - (item.start_minute || 0)) / 60) * 100;
                  const left = ((item.start_minute || 0) / 60) * 100;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  return (
                    <div
                      key={idx}
                      className={`absolute h-full ${colors[idx % colors.length]} flex items-center justify-center text-[10px] text-white font-bold border-r border-white/20`}
                      style={{ width: `${width}%`, left: `${left}%` }}
                    >
                      {width > 10 && `${item.start_minute}-${item.end_minute}`}
                    </div>
                  );
               })}
            </div>
            
            <div className="space-y-3">
              {editedItems.map((item, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-background shadow-sm">
                  <div className="w-16 space-y-1">
                    <Label className="text-[10px]">শুরু</Label>
                    <Input 
                      type="number" 
                      value={item.start_minute} 
                      readOnly
                      className="h-8 bg-muted text-xs" 
                    />
                  </div>
                  <div className="w-16 space-y-1">
                    <Label className="text-[10px]">শেষ</Label>
                    <Input 
                      type="number" 
                      value={item.end_minute} 
                      onChange={e => updateItem(index, { end_minute: Math.min(Math.max(Number(e.target.value), (item.start_minute || 0) + 1), 60) })}
                      className="h-8 text-xs" 
                    />
                  </div>
                  <div className="flex-1 min-w-[150px] space-y-1">
                    <Label className="text-[10px]">ধরন</Label>
                    <Select value={item.item_type} onValueChange={v => updateItem(index, { item_type: v as any, playlist_id: undefined, track_id: undefined })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="song">গান</SelectItem>
                        <SelectItem value="jingle">জিঙ্গেল</SelectItem>
                        <SelectItem value="news">সংবাদ</SelectItem>
                        <SelectItem value="advertisement">বিজ্ঞাপন</SelectItem>
                        <SelectItem value="voiceover">ভয়েস ট্র্যাকিং</SelectItem>
                        <SelectItem value="playlist">প্লেলিস্ট</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {item.item_type === 'playlist' && (
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <Label className="text-[10px]">প্লেলিস্ট নির্বাচন করুন</Label>
                      <Select value={item.playlist_id} onValueChange={v => updateItem(index, { playlist_id: v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {playlists.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full h-10 border-dashed" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" /> নতুন সেগমেন্ট যুক্ত করুন
              </Button>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>বাতিল</Button>
            <Button className="gap-2" onClick={handleSaveItems}>
              <Save className="w-4 h-4" /> সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
