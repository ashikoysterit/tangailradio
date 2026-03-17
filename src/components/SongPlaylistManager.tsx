import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Music, 
  Upload, 
  Loader2, 
  Search, 
  Play, 
  ListMusic, 
  Shuffle, 
  ListOrdered,
  X,
  CheckCircle2,
  FileAudio,
  Edit,
  LayoutDashboard,
  Filter,
  MoreVertical,
  Check,
  Zap
} from 'lucide-react';
import { 
  fetchTracks, 
  createTrack, 
  deleteTrack, 
  updateTrack,
  fetchPlaylists, 
  createPlaylist, 
  deletePlaylist,
  updatePlaylistTracks,
  fetchPlaylistWithTracks
} from '@/db/api';
import { Track, Playlist, AudioType } from '../types/types';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import * as mm from 'music-metadata-browser';
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

const TrackEditDialog: React.FC<{ 
  track: Track; 
  onUpdate: () => void; 
  trigger?: React.ReactNode 
}> = ({ track, onUpdate, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: track.title,
    artist: track.artist || '',
    weight: track.weight || 1,
    category: track.category || 'General',
    cue_in: track.cue_in || 0,
    cue_out: track.cue_out || track.duration || 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateTrack(track.id, {
        title: formData.title,
        artist: formData.artist,
        weight: Number(formData.weight),
        category: formData.category,
        cue_in: Number(formData.cue_in),
        cue_out: Number(formData.cue_out),
      });
      toast.success('ট্র্যাক আপডেট করা হয়েছে');
      onUpdate();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Edit className="w-4 h-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ট্র্যাক তথ্য সম্পাদনা করুন</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>টাইটেল</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>আর্টিস্ট</Label>
            <Input value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ক্যাটাগরি</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Hit">Hit</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="Recitation">Recitation</SelectItem>
                  <SelectItem value="Classic">Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>পছন্দের গুরুত্ব (Weight: 1-10)</Label>
              <Input type="number" min="1" max="10" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
             <div className="space-y-2">
                <Label className="text-xs">Cue-In (Start)</Label>
                <div className="flex items-center gap-2">
                   <Input type="number" step="0.1" value={formData.cue_in} onChange={e => setFormData({...formData, cue_in: Number(e.target.value)})} className="h-8" />
                   <span className="text-[10px] text-muted-foreground">sec</span>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-xs">Cue-Out (End)</Label>
                <div className="flex items-center gap-2">
                   <Input type="number" step="0.1" value={formData.cue_out} onChange={e => setFormData({...formData, cue_out: Number(e.target.value)})} className="h-8" />
                   <span className="text-[10px] text-muted-foreground">sec</span>
                </div>
             </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Cue-In/Out ব্যবহার করে গানের অপ্রয়োজনীয় অংশ বাদ দিতে পারেন।</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const SongPlaylistManager: React.FC = () => {
  const [songs, setSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Playlist state
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistType, setNewPlaylistType] = useState<'shuffle' | 'sequential'>('shuffle');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tracksData, playlistsData] = await Promise.all([
        fetchTracks('song'),
        fetchPlaylists()
      ]);
      setSongs(tracksData);
      setPlaylists(playlistsData);
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadProgress(0);
        
        // Extract metadata
        let title = file.name.replace(/\.[^/.]+$/, "");
        let artist = 'অজানা শিল্পী';
        let duration = 0;

        try {
          const metadata = await mm.parseBlob(file);
          if (metadata.common.title) title = metadata.common.title;
          if (metadata.common.artist) artist = metadata.common.artist;
          if (metadata.format.duration) duration = Math.round(metadata.format.duration);
        } catch (metaErr) {
          console.warn('মেটাডেটা এক্সট্রাকশন ব্যর্থ হয়েছে:', metaErr);
        }

        // Upload to storage
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
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

        // Save to DB
        await createTrack({
          title,
          artist,
          audio_url: publicUrl,
          duration,
          type: 'song'
        });

        successCount++;
      } catch (err) {
        console.error(`ফাইল আপলোড ব্যর্থ হয়েছে (${file.name}):`, err);
        toast.error(`${file.name} আপলোড করতে সমস্যা হয়েছে`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} টি গান সফলভাবে আপলোড করা হয়েছে`);
      loadData();
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই গানটি মুছে ফেলতে চান?')) return;
    try {
      await deleteTrack(id);
      toast.success('গান মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) {
      toast.error('প্লেলিস্টের নাম দিন');
      return;
    }
    try {
      await createPlaylist(newPlaylistName, newPlaylistType);
      toast.success('প্লেলিস্ট তৈরি করা হয়েছে');
      setNewPlaylistName('');
      setIsPlaylistDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('প্লেলিস্ট তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই প্লেলিস্টটি মুছে ফেলতে চান?')) return;
    try {
      await deletePlaylist(id);
      toast.success('প্লেলিস্ট মুছে ফেলা হয়েছে');
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const loadPlaylistTracks = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    try {
      const data = await fetchPlaylistWithTracks(playlist.id);
      setPlaylistTracks(data.tracks || []);
    } catch (err) {
      console.error(err);
      toast.error('প্লেলিস্টের গান লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleAddTrackToPlaylist = async (song: Track) => {
    if (!selectedPlaylist) return;
    if (playlistTracks.some(t => t.id === song.id)) {
      toast.info('এই গানটি ইতিমধ্যে প্লেলিস্টে আছে');
      return;
    }
    const updatedTracks = [...playlistTracks, song];
    setPlaylistTracks(updatedTracks);
    try {
      await updatePlaylistTracks(selectedPlaylist.id, updatedTracks.map(t => t.id));
      toast.success('প্লেলিস্টে যোগ করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('প্লেলিস্ট আপডেট করতে ব্যর্থ হয়েছে');
    }
  };

  const handleRemoveTrackFromPlaylist = async (songId: string) => {
    if (!selectedPlaylist) return;
    const updatedTracks = playlistTracks.filter(t => t.id !== songId);
    setPlaylistTracks(updatedTracks);
    try {
      await updatePlaylistTracks(selectedPlaylist.id, updatedTracks.map(t => t.id));
    } catch (err) {
      console.error(err);
      toast.error('প্লেলিস্ট আপডেট করতে ব্যর্থ হয়েছে');
    }
  };

  const handleReorderTracks = async (newOrder: Track[]) => {
    if (!selectedPlaylist) return;
    setPlaylistTracks(newOrder);
    try {
      await updatePlaylistTracks(selectedPlaylist.id, newOrder.map(t => t.id));
    } catch (err) {
      console.error(err);
      toast.error('ক্রম পরিবর্তন করতে ব্যর্থ হয়েছে');
    }
  };

  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const handleToggleBulkTrack = (id: string) => {
    setSelectedTracks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleAddBulkToPlaylist = async () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;
    const tracksToAdd = songs.filter(s => selectedTracks.includes(s.id));
    const updatedTracks = [...playlistTracks, ...tracksToAdd.filter(s => !playlistTracks.some(t => t.id === s.id))];
    setPlaylistTracks(updatedTracks);
    try {
      await updatePlaylistTracks(selectedPlaylist.id, updatedTracks.map(t => t.id));
      toast.success('সবগুলো প্লেলিস্টে যোগ করা হয়েছে');
      setSelectedTracks([]);
      setIsBulkMode(false);
    } catch (err) {
      console.error(err);
      toast.error('আপডেট করতে ব্যর্থ হয়েছে');
    }
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      song.artist?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || song.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'General', 'Hit', 'Gold', 'Local', 'Recitation', 'Classic'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary">গান ও প্লেলিস্ট ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">আপনার রেডিও স্টেশনের গান আপলোড এবং প্লেলিস্ট সাজান</p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild disabled={isUploading} className="bg-primary hover:bg-primary/90">
            <label className="cursor-pointer">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              গান আপলোড করুন
              <input type="file" className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
            </label>
          </Button>
          
          <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> নতুন প্লেলিস্ট
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন প্লেলিস্ট তৈরি করুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>প্লেলিস্টের নাম</Label>
                  <Input 
                    value={newPlaylistName} 
                    onChange={e => setNewPlaylistName(e.target.value)} 
                    placeholder="প্লেলিস্টের নাম লিখুন..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>প্লেব্যাক মোড</Label>
                  <Select value={newPlaylistType} onValueChange={(v: any) => setNewPlaylistType(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="মোড নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shuffle">শাফেল (এলোমেলো)</SelectItem>
                      <SelectItem value="sequential">সিকুয়েনশিয়াল (পর্যায়ক্রমিক)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPlaylistDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleCreatePlaylist}>তৈরি করুন</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isUploading && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-bold">গান আপলোড হচ্ছে...</span>
              </div>
              <span className="text-sm font-bold">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Songs List Column */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  সকল গান ({filteredSongs.length})
                </CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button 
                    variant={isBulkMode ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setIsBulkMode(!isBulkMode);
                      setSelectedTracks([]);
                    }}
                  >
                    {isBulkMode ? 'Bulk Mode: অন' : 'Bulk Mode'}
                  </Button>
                  {isBulkMode && selectedTracks.length > 0 && selectedPlaylist && (
                    <Button size="sm" onClick={handleAddBulkToPlaylist} className="gap-2 bg-green-600 hover:bg-green-700">
                      <Zap className="w-4 h-4" /> {selectedTracks.length}টি যোগ করুন
                    </Button>
                  )}
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="গান খুঁজুন..." 
                      className="pl-8 bg-background/50" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-[10px] rounded-full px-3"
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-1 divide-y">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">লোড হচ্ছে...</p>
                  </div>
                ) : filteredSongs.length > 0 ? (
                  filteredSongs.map(song => (
                    <div 
                      key={song.id} 
                      className={`p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group cursor-pointer ${selectedTracks.includes(song.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => isBulkMode ? handleToggleBulkTrack(song.id) : null}
                    >
                      {isBulkMode ? (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedTracks.includes(song.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                          {selectedTracks.includes(song.id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Play className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold truncate">{song.title}</h4>
                          {song.category && (
                            <span className="text-[9px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-bold">
                              {song.category}
                            </span>
                          )}
                          {(song.weight || 0) > 1 && (
                            <span className="text-[9px] text-primary font-black">
                              W:{song.weight}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!isBulkMode && (
                          <div className="flex gap-1">
                            <TrackEditDialog track={song} onUpdate={loadData} />
                            {selectedPlaylist && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => handleAddTrackToPlaylist(song)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteSong(song.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <FileAudio className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>কোনো গান পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playlists Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-primary" />
                প্লেলিস্টসমূহ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto divide-y">
                {playlists.length > 0 ? (
                  playlists.map(playlist => (
                    <div 
                      key={playlist.id} 
                      className={`p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors ${selectedPlaylist?.id === playlist.id ? 'bg-primary/10 border-r-4 border-primary' : ''}`}
                      onClick={() => loadPlaylistTracks(playlist)}
                    >
                      <div className="flex items-center gap-3">
                        {playlist.type === 'shuffle' ? <Shuffle className="w-4 h-4 text-muted-foreground" /> : <ListOrdered className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <h4 className="font-bold text-sm">{playlist.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{playlist.type === 'shuffle' ? 'শাফেল' : 'সিকুয়েনশিয়াল'}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">কোনো প্লেলিস্ট নেই</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedPlaylist && (
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-primary/10 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {selectedPlaylist.name} (গানের তালিকা)
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedPlaylist(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  <Reorder.Group axis="y" values={playlistTracks} onReorder={handleReorderTracks} className="divide-y">
                    {playlistTracks.map((track) => (
                      <Reorder.Item key={track.id} value={track} className="p-3 flex items-center gap-3 bg-card hover:bg-muted/20 cursor-grab active:cursor-grabbing">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                          {playlistTracks.indexOf(track) + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate">{track.title}</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveTrackFromPlaylist(track.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  {playlistTracks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-xs">প্লেলিস্টে কোনো গান নেই। বাম পাশ থেকে গান যোগ করুন।</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {playlistTracks.length > 1 && (
                <CardFooter className="p-2 border-t bg-muted/20">
                  <p className="text-[10px] text-muted-foreground w-full text-center italic">গানগুলোর ক্রম পরিবর্তন করতে টেনে আনুন</p>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
