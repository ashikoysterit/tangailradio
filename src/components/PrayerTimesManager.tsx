import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { fetchPrayerTimes, updatePrayerTimes } from '@/db/api';
import { toast } from 'sonner';
import { Clock, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrayerTimes {
  id: number;
  fajr_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  jummah_time: string;
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

export const PrayerTimesManager: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ফর্ম স্টেট
  const [fajrTime, setFajrTime] = useState('05:00');
  const [dhuhrTime, setDhuhrTime] = useState('12:30');
  const [asrTime, setAsrTime] = useState('16:00');
  const [maghribTime, setMaghribTime] = useState('18:15');
  const [ishaTime, setIshaTime] = useState('19:30');
  const [jummahTime, setJummahTime] = useState('13:00');
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
        setFajrTime(data.fajr_time.substring(0, 5));
        setDhuhrTime(data.dhuhr_time.substring(0, 5));
        setAsrTime(data.asr_time.substring(0, 5));
        setMaghribTime(data.maghrib_time.substring(0, 5));
        setIshaTime(data.isha_time.substring(0, 5));
        setJummahTime(data.jummah_time.substring(0, 5));
        setActive(data.active);
      }
    } catch (err) {
      console.error(err);
      toast.error('নামাজের সময় লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePrayerTimes({
        fajr_time: fajrTime + ':00',
        dhuhr_time: dhuhrTime + ':00',
        asr_time: asrTime + ':00',
        maghrib_time: maghribTime + ':00',
        isha_time: ishaTime + ':00',
        jummah_time: jummahTime + ':00',
        active
      });
      toast.success('নামাজের সময় সফলভাবে আপডেট করা হয়েছে');
      loadPrayerTimes();
    } catch (err) {
      console.error(err);
      toast.error('নামাজের সময় আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">নামাজের সময় ব্যবস্থাপনা</h2>
        <p className="text-sm text-muted-foreground">পাঁচ ওয়াক্ত নামাজ এবং জুম্মার সময় নির্ধারণ করুন</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>আযানের সময়সূচী</CardTitle>
                  <CardDescription>
                    প্রতিদিন (শুক্রবার ছাড়া) এই সময়ে স্বয়ংক্রিয়ভাবে আযান প্রচারিত হবে
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="active-switch" className="text-sm font-bold">সক্রিয়</Label>
                <Switch
                  id="active-switch"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* দৈনিক নামাজের সময় */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">দৈনিক নামাজের সময় (শনিবার - বৃহস্পতিবার)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {prayerNames.fajr}
                  </Label>
                  <Input
                    type="time"
                    value={fajrTime}
                    onChange={(e) => setFajrTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    {prayerNames.dhuhr}
                  </Label>
                  <Input
                    type="time"
                    value={dhuhrTime}
                    onChange={(e) => setDhuhrTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {prayerNames.asr}
                  </Label>
                  <Input
                    type="time"
                    value={asrTime}
                    onChange={(e) => setAsrTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {prayerNames.maghrib}
                  </Label>
                  <Input
                    type="time"
                    value={maghribTime}
                    onChange={(e) => setMaghribTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {prayerNames.isha}
                  </Label>
                  <Input
                    type="time"
                    value={ishaTime}
                    onChange={(e) => setIshaTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                </div>
              </div>
            </div>

            {/* জুম্মার সময় */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">জুম্মার নামাজ (শুধুমাত্র শুক্রবার)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {prayerNames.jummah}
                  </Label>
                  <Input
                    type="time"
                    value={jummahTime}
                    onChange={(e) => setJummahTime(e.target.value)}
                    className="font-mono text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    শুক্রবারে যোহরের পরিবর্তে এই সময়ে আযান হবে
                  </p>
                </div>
              </div>
            </div>

            {/* সংরক্ষণ বাটন */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    সংরক্ষণ করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    সংরক্ষণ করুন
                  </>
                )}
              </Button>
            </div>

            {/* নির্দেশনা */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                গুরুত্বপূর্ণ তথ্য
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• আযান স্বয়ংক্রিয়ভাবে প্রচারিত হওয়ার জন্য "আযান" টাইপের অডিও ফাইল আপলোড করুন</li>
                <li>• শনিবার থেকে বৃহস্পতিবার পর্যন্ত পাঁচ ওয়াক্ত নামাজের সময় অনুযায়ী আযান হবে</li>
                <li>• শুক্রবারে শুধুমাত্র জুম্মার সময় অনুযায়ী আযান হবে (যোহরের পরিবর্তে)</li>
                <li>• সময় বাংলাদেশ স্ট্যান্ডার্ড টাইম (BST) অনুযায়ী সেট করুন</li>
                <li>• আযান শেষ হওয়ার পর স্বয়ংক্রিয়ভাবে নিয়মিত প্লেলিস্ট চালু হবে</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
