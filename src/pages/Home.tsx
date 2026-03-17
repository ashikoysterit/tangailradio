import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Slider } from '@/components/Slider';
import { NoticeBoard } from '@/components/NoticeBoard';
import { CommentBox } from '@/components/CommentBox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Users, Music, Activity, Headphones, Heart, Share2, Globe, Clock, User, Calendar, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPrograms } from '@/db/api';
import { Program } from '../types/types';
import { ProgramTabs } from '@/components/ProgramTabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const Home: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await fetchPrograms();
        setPrograms(data.filter(p => p.active));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPrograms();
  }, []);

  const stats = [
    { icon: Headphones, label: 'শ্রোতা', value: '৫০০০+', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Music, label: 'গান', value: '১২০০+', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Globe, label: 'কভারেজ', value: 'বিশ্বজুড়ে', color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Heart, label: 'পছন্দ', value: '৯৯%', color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <Layout>
      <div className="space-y-12">
        <section className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl overflow-hidden shadow-2xl border border-primary/10"
          >
            <Slider />
          </motion.div>
        </section>

        <motion.section 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={item}>
              <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className={`p-4 rounded-2xl ${stat.bg} mb-4`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">{stat.value}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.section 
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black border-l-4 border-primary pl-4 shrink-0">অনুষ্ঠানমালা</h3>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 gap-2 font-bold">সবগুলো <Share2 className="w-4 h-4" /></Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loading ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[120px] bg-muted animate-pulse rounded-2xl" />
                  ))
                ) : programs.length > 0 ? (
                  programs.map((program, idx) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card 
                        className="group relative overflow-hidden border-none shadow-md bg-card/40 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl h-[140px]"
                        onClick={() => setSelectedProgram(program)}
                      >
                        <CardContent className="p-0 h-full relative">
                          <img 
                            src={program.image_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2d4575d0-8bae-4292-91ec-7228ca4a07d7.jpg'} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                            alt={program.title} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="bg-primary/90 text-[7px] font-black text-white uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm">
                                {program.schedule_time || 'Daily'}
                              </span>
                              {program.active && (
                                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                              )}
                            </div>
                            <h4 className="text-white font-black text-xs mb-0.5 truncate group-hover:text-primary transition-colors leading-tight">{program.title}</h4>
                            <div className="flex items-center gap-1 text-white/50">
                               <User className="w-2 h-2" />
                               <span className="text-[8px] font-medium truncate">{program.host_name || 'Radio'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card className="col-span-full border-dashed border-2 bg-muted/20">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Radio className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="font-bold text-sm">কোনো নির্ধারিত অনুষ্ঠান নেই</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Program Details Modal */}
              <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                  {selectedProgram && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col"
                    >
                      <div className="h-[300px] relative">
                         <img src={selectedProgram.image_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=1200'} className="w-full h-full object-cover" alt={selectedProgram.title} />
                         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                         <div className="absolute bottom-6 left-8 right-8">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                                  Featured Show
                               </span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">{selectedProgram.title}</h2>
                         </div>
                      </div>
                      <div className="p-8 space-y-6">
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-muted/30 p-4 rounded-2xl border border-muted-foreground/10">
                               <div className="flex items-center gap-2 text-primary mb-1">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
                               </div>
                               <p className="font-bold">{selectedProgram.schedule_time || 'Not Scheduled'}</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-2xl border border-muted-foreground/10">
                               <div className="flex items-center gap-2 text-primary mb-1">
                                  <User className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Host</span>
                               </div>
                               <p className="font-bold">{selectedProgram.host_name || 'Station Host'}</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-2xl border border-muted-foreground/10 col-span-2 md:col-span-1">
                               <div className="flex items-center gap-2 text-primary mb-1">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Frequency</span>
                               </div>
                               <p className="font-bold">
                                  {selectedProgram.days_of_week?.length === 7 ? 'প্রতিদিন' : 'নির্ধারিত দিনগুলোতে'}
                               </p>
                            </div>
                         </div>
                         
                         <div className="space-y-4">
                            <h3 className="text-lg font-black border-l-4 border-primary pl-4">অনুষ্ঠান সম্পর্কে বিস্তারিত</h3>
                            <p className="text-muted-foreground leading-relaxed">
                               {selectedProgram.description || 'এই অনুষ্ঠানটি সম্পর্কে কোনো বিস্তারিত তথ্য পাওয়া যায়নি। অনুষ্ঠানটি শুনতে আমাদের সাথেই থাকুন।'}
                            </p>
                         </div>
                         
                         <div className="pt-6 border-t flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                               <span className="text-sm font-bold text-muted-foreground">টাঙ্গাইল রেডিও তে লাইভ শুনুন</span>
                            </div>
                            <Button className="rounded-full px-8 h-12 font-black gap-2 shadow-xl shadow-primary/20">
                               <Play className="w-5 h-5 fill-current" /> এখন শুনুন
                            </Button>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </DialogContent>
              </Dialog>
            </motion.section>

            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-primary/5 rounded-3xl p-8 border border-primary/10"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="shrink-0">
                  <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Radio className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-2xl font-bold tracking-tight">টাঙ্গাইল রেডিওর লক্ষ্য</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    টাঙ্গাইল রেডিও একটি আধুনিক অনলাইন ব্রডকাস্টিং প্ল্যাটফর্ম। আমরা মানসম্পন্ন কন্টেন্ট, গান এবং খবরের মাধ্যমে শ্রোতাদের বিনোদন ও তথ্য প্রদান করে আসছি। টাঙ্গাইলের ঐতিহ্য ও সংস্কৃতিকে ডিজিটাল মাধ্যমে তুলে ধরাই আমাদের প্রধান লক্ষ্য।
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <ProgramTabs />

            <div className="rounded-3xl overflow-hidden shadow-xl border border-primary/10">
              <NoticeBoard />
            </div>
            
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Radio className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">আমাদের সাথে যুক্ত হোন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <p className="text-sm text-white/80">
                  টাঙ্গাইল রেডিওতে বিজ্ঞাপন দিতে বা কোনো প্রশ্ন থাকলে সরাসরি আমাদের কল করুন।
                </p>
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">হটলাইন</p>
                    <p className="font-bold text-lg">01303216921</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* মন্তব্য বক্স */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CommentBox />
        </motion.section>
      </div>
    </Layout>
  );
};

export default Home;
