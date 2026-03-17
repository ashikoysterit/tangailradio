import React, { useEffect, useState } from 'react';
import { fetchNews } from '@/db/api';
import { News } from '../types/types';

export const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);

  useEffect(() => {
    fetchNews().then(setNews).catch(console.error);
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-1.5 overflow-hidden relative shadow-inner">
      <div className="absolute left-0 top-0 bottom-0 bg-primary/95 px-4 z-10 flex items-center font-black text-xs md:text-sm uppercase tracking-tighter border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          ব্রেকিং নিউজ
        </span>
      </div>
      <div className="whitespace-nowrap animate-marquee flex gap-16 pl-32 md:pl-40 items-center min-h-[28px]">
        {news.map((item) => (
          <span key={item.id} className="text-xs md:text-sm font-medium tracking-tight opacity-90 hover:opacity-100 transition-opacity">
            {item.content}
          </span>
        ))}
      </div>
    </div>
  );
};
