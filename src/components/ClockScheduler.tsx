import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  fetchClocks, 
  fetchClockSchedules, 
  updateClockSchedule 
} from '@/db/api';
import { Clock, ClockSchedule } from '../types/types';
import { toast } from 'sonner';
import { Calendar, Clock as ClockIcon, Loader2, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const bengaliDaysShort = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const bengaliDaysFull = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const ClockScheduler: React.FC = () => {
  const [clocks, setClocks] = useState<(Clock)[]>([]);
  const [schedules, setSchedules] = useState<(ClockSchedule & { clocks: Clock })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clocksData, schedulesData] = await Promise.all([
        fetchClocks(),
        fetchClockSchedules()
      ]);
      setClocks(clocksData);
      setSchedules(schedulesData);
    } catch (err) {
      console.error(err);
      toast.error('ডেটা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (day: number, hour: number, clockId: string | null) => {
    setIsSaving(true);
    try {
      await updateClockSchedule(clockId, day, hour);
      toast.success('শিডিউল আপডেট করা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const getScheduledClock = (day: number, hour: number) => {
    return schedules.find(s => s.day_of_week === day && s.hour === hour && !s.specific_date);
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" />
              সাপ্তাহিক শিডিউল (Clock Scheduler)
            </CardTitle>
            <CardDescription>প্রতি ঘন্টার জন্য ক্লক টেমপ্লেট নির্ধারণ করুন</CardDescription>
          </div>
          <div className="flex bg-muted p-1 rounded-lg">
             <Button 
                variant={viewMode === 'weekly' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('weekly')}
             >
                সাপ্তাহিক
             </Button>
             <Button 
                variant={viewMode === 'daily' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('daily')}
             >
                দৈনিক
             </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {viewMode === 'weekly' ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 border-r text-xs font-bold w-20">সময়</th>
                {bengaliDaysShort.map((day, i) => (
                  <th key={i} className="p-3 text-xs font-bold text-center border-r last:border-r-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }).map((_, hour) => (
                <tr key={hour} className="border-b last:border-b-0 hover:bg-primary/5 transition-colors group">
                  <td className="p-2 border-r text-center text-[10px] font-bold bg-muted/20">
                    {hour < 10 ? '০' : ''}{hour}:০০
                  </td>
                  {Array.from({ length: 7 }).map((_, day) => {
                    const scheduled = getScheduledClock(day, hour);
                    return (
                      <td key={day} className="p-1 border-r last:border-r-0 min-w-[120px]">
                        <Select 
                           value={scheduled?.clock_id || 'none'} 
                           onValueChange={(v) => handleAssign(day, hour, v === 'none' ? null : v)}
                           disabled={isSaving}
                        >
                          <SelectTrigger className={`h-8 text-[10px] border-none shadow-none focus:ring-0 ${scheduled ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'}`}>
                            <SelectValue placeholder="সিলেক্ট" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="none">--- কোনোটিই নয় ---</SelectItem>
                            {clocks.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 space-y-4">
             <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}>
                   <ChevronLeft className="w-6 h-6" />
                </Button>
                <h3 className="text-xl font-black text-primary">{bengaliDaysFull[selectedDay]}</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDay((selectedDay + 1) % 7)}>
                   <ChevronRight className="w-6 h-6" />
                </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 24 }).map((_, hour) => {
                   const scheduled = getScheduledClock(selectedDay, hour);
                   return (
                     <Card key={hour} className={`flex items-center p-4 gap-4 transition-all hover:shadow-md ${scheduled ? 'border-primary bg-primary/5' : 'bg-muted/10'}`}>
                        <div className="w-16 text-center font-black text-sm text-primary">
                           {hour < 10 ? '০' : ''}{hour}:০০
                        </div>
                        <div className="flex-1">
                           <Select 
                              value={scheduled?.clock_id || 'none'} 
                              onValueChange={(v) => handleAssign(selectedDay, hour, v === 'none' ? null : v)}
                              disabled={isSaving}
                           >
                             <SelectTrigger className="w-full bg-background border shadow-sm h-10">
                               <SelectValue placeholder="ক্লক টেমপ্লেট নির্বাচন করুন" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="none">--- কোনোটিই নয় ---</SelectItem>
                               {clocks.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                             </SelectContent>
                           </Select>
                        </div>
                     </Card>
                   );
                })}
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
