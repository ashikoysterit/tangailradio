import React, { useEffect, useState } from 'react';
import { fetchNotices } from '@/db/api';
import { Notice } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    fetchNotices().then(setNotices).catch(console.error);
  }, []);

  return (
    <Card className="h-full border-none shadow-2xl bg-gradient-to-br from-card to-muted/20 overflow-hidden rounded-3xl">
      <CardHeader className="flex flex-row items-center gap-3 bg-primary/5 border-b border-primary/10 p-6">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Bell className="w-5 h-5 text-primary animate-bounce" />
        </div>
        <CardTitle className="text-xl font-black tracking-tight">নোটিশ বোর্ড</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto divide-y divide-primary/5 scrollbar-hide">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">বর্তমানে কোনো গুরুত্বপূর্ণ নোটিশ নেই</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="p-6 hover:bg-primary/5 transition-colors cursor-default group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-extrabold text-lg text-foreground/90 group-hover:text-primary transition-colors leading-tight">{notice.title}</h4>
                  <div className="bg-muted px-2 py-1 rounded text-[10px] font-bold text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(notice.created_at).toLocaleDateString('bn-BD')}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                <div className="mt-4 h-1 w-0 group-hover:w-full bg-primary/20 transition-all duration-500 rounded-full" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
