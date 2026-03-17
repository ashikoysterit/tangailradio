import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { fetchPrayerTimes, updatePrayerTimes } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Clock, Save, Loader2, Upload, Music, Trash2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrayerTimes {
  id: number;
  fajr_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  jummah_time: string;
  fajr_intro_url?: string;
  fajr_adhan_url?: string;
  dhuhr_intro_url?: string;
  dhuhr_adhan_url?: string;
  asr_intro_url?: string;
  asr_adhan_url?: string;
  maghrib_intro_url?: string;
  maghrib_adhan_url?: string;
  isha_intro_url?: string;
  isha_adhan_url?: string;
  jummah_intro_url?: string;
  jummah_adhan_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const prayerNames = {
  fajr: 'ফজর',
  dhuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'এশা',
  jummah: 'জুম্মা'
};

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah';

export const PrayerTimesManagerEnhanced: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [times, setTimes] = useState({
    fajr: '05:00',
    dhuhr: '12:30',
    asr: '16:00',
    maghrib: '18:15',
    isha: '19:30',
    jummah: '13:00'
  });
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadPrayerTimes();
  }, []);

  const loadPrayerTimes = async () => {
    setLoading(true);
    try {
      const data = await fetchPrayerTimes();
      if (data) {
        setPrayerTimes(data);
        setTimes({
          fajr: data.fajr_time,
          dhuhr: data.dhuhr_time,
          asr: data.asr_time,
          maghrib: data.maghrib_time,
          isha: data.isha_time,
          jummah: data.jummah_time
        });
        setActive(data.active);
      }
    } catch (error) {
      console.error('Error loading prayer times:', error);
      toast.error('নামাজের সময় লোড করতে ব্যর্থ হয়েছে');
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

  const handleAudioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    prayerKey: PrayerKey,
    audioType: 'intro' | 'adhan'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = `${prayerKey}_${audioType}`;
    setUploading(uploadKey);

    try {
      const url = await handleFileUpload(file, 'tangail_radio_audio');
      if (url) {
        const fieldName = `${prayerKey}_${audioType}_url` as keyof PrayerTimes;
        await updatePrayerTimes({
          [fieldName]: url
        });
        await loadPrayerTimes();
        toast.success(`${prayerNames[prayerKey]} ${audioType === 'intro' ? 'ইন্ট্রো' : 'আযান'} আপলোড সফল হয়েছে`);
      } else {
        toast.error('আপলোড ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteAudio = async (prayerKey: PrayerKey, audioType: 'intro' | 'adhan') => {
    try {
      const fieldName = `${prayerKey}_${audioType}_url` as keyof PrayerTimes;
      await updatePrayerTimes({
        [fieldName]: null
      });
      await loadPrayerTimes();
      toast.success('অডিও মুছে ফেলা হয়েছে');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePrayerTimes({
        fajr_time: times.fajr,
        dhuhr_time: times.dhuhr,
        asr_time: times.asr,
        maghrib_time: times.maghrib,
        isha_time: times.isha,
        jummah_time: times.jummah,
        active
      });
      await loadPrayerTimes();
      toast.success('নামাজের সময়সূচী সংরক্ষিত হয়েছে');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const renderPrayerRow = (prayerKey: PrayerKey) => {
    const introUrl = prayerTimes?.[`${prayerKey}_intro_url` as keyof PrayerTimes] as string | undefined;
    const adhanUrl = prayerTimes?.[`${prayerKey}_adhan_url` as keyof PrayerTimes] as string | undefined;
    const uploadingIntro = uploading === `${prayerKey}_intro`;
    const uploadingAdhan = uploading === `${prayerKey}_adhan`;

    return (
      <motion.div
        key={prayerKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-xl p-4 bg-muted/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{prayerNames[prayerKey]}</h3>
          </div>
          <Input
            type="time"
            value={times[prayerKey]}
            onChange={(e) => setTimes({ ...times, [prayerKey]: e.target.value })}
            className="w-32"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ইন্ট্রো আপলোড */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ইন্ট্রো অডিও</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={uploadingIntro}
                onClick={() => document.getElementById(`${prayerKey}_intro_input`)?.click()}
              >
                {uploadingIntro ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {introUrl ? 'পরিবর্তন করুন' : 'আপলোড করুন'}
              </Button>
              <input
                id={`${prayerKey}_intro_input`}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleAudioUpload(e, prayerKey, 'intro')}
              />
              {introUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const audio = new Audio(introUrl);
                      audio.play();
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAudio(prayerKey, 'intro')}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
            {introUrl && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Music className="w-3 h-3" />
                ইন্ট্রো আপলোড করা আছে
              </p>
            )}
          </div>

          {/* আযান আপলোড */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">আযান অডিও</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={uploadingAdhan}
                onClick={() => document.getElementById(`${prayerKey}_adhan_input`)?.click()}
              >
                {uploadingAdhan ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {adhanUrl ? 'পরিবর্তন করুন' : 'আপলোড করুন'}
              </Button>
              <input
                id={`${prayerKey}_adhan_input`}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleAudioUpload(e, prayerKey, 'adhan')}
              />
              {adhanUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const audio = new Audio(adhanUrl);
                      audio.play();
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAudio(prayerKey, 'adhan')}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
            {adhanUrl && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Music className="w-3 h-3" />
                আযান আপলোড করা আছে
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>নামাজের সময়সূচী ও অডিও ম্যানেজমেন্ট</CardTitle>
            <CardDescription>
              প্রতিটি নামাজের সময় নির্ধারণ করুন এবং ইন্ট্রো ও আযানের অডিও আপলোড করুন
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm">সক্রিয়</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>গুরুত্বপূর্ণ:</strong> নামাজের সময় হলে বর্তমান প্লেব্যাক স্বয়ংক্রিয়ভাবে বন্ধ হয়ে ইন্ট্রো এবং আযান প্লে হবে। 
            আযান শেষ হলে আগের কন্টেন্ট পুনরায় চালু হবে।
          </p>
        </div>

        {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummah'] as PrayerKey[]).map(renderPrayerRow)}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                সংরক্ষণ করুন
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
