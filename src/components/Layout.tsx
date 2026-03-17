import React, { useEffect, useState } from 'react';
import { RadioPlayer } from '@/components/RadioPlayer';
import { NewsTicker } from '@/components/NewsTicker';
import { BengaliClockWeather } from '@/components/BengaliClockWeather';
import { fetchSettings } from '@/db/api';
import { StationSettings } from '../types/types';
import { Radio, Phone, Mail, MapPin, Facebook, Twitter, Youtube, Instagram } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [settings, setSettings] = useState<StationSettings | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-32 md:pb-28">
      <header className="bg-card/80 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-2xl shadow-lg shadow-primary/20">
              <Radio className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {settings?.name || 'টাঙ্গাইল রেডিও'}
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
                অনলাইন রেডিও স্টেশন
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="p-2 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">যোগাযোগ</p>
                <p className="text-sm font-bold">{settings?.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="p-2 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">ইমেইল</p>
                <p className="text-sm font-bold">{settings?.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-2">
          <NewsTicker />
        </div>
      </header>

      {/* বাংলা ঘড়ি এবং আবহাওয়া */}
      <BengaliClockWeather />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        {children}
      </main>

      <footer className="bg-card/50 backdrop-blur-sm border-t border-border mt-auto pt-16 pb-40 md:pb-36 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl">
                <Radio className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter">{settings?.name}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              টাঙ্গাইল জেলা থেকে পরিচালিত একটি প্রফেসনাল অনলাইন রেডিও স্টেশন। আমাদের লক্ষ্য টাঙ্গাইলের সংস্কৃতি, ঐতিহ্য এবং বিনোদনকে ডিজিটাল মাধ্যমে সকলের মাঝে ছড়িয়ে দেয়া।
            </p>
            <div className="flex gap-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Instagram, label: 'Instagram' }
              ].map(social => (
                <div key={social.label} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer group">
                  <span className="sr-only">{social.label}</span>
                  <social.icon className="w-5 h-5 opacity-80 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-primary/20 pb-2 inline-block">ঠিকানা</h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/5">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                </div>
                <span className="text-sm leading-relaxed">{settings?.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/5">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                </div>
                <span className="text-sm font-bold">{settings?.mobile}</span>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-primary/20 pb-2 inline-block">কর্তৃপক্ষ</h3>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">চেয়ারম্যান</p>
              <p className="font-black text-primary text-lg">{settings?.chairman}</p>
              <p className="text-[10px] text-muted-foreground">টাঙ্গাইল রেডিও অনলাইন</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-border mt-16 pt-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            © 2026 <span className="text-primary font-bold">{settings?.name}</span> — সর্বস্বত্ব সংরক্ষিত
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            মেইড উইথ লাভ ইন টাঙ্গাইল
          </p>
        </div>
      </footer>

      <RadioPlayer />
    </div>
  );
};
