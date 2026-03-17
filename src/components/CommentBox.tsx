import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { fetchComments, createComment } from '@/db/api';
import { toast } from 'sonner';
import { MessageSquare, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

export const CommentBox: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const data = await fetchComments(true); // Only approved comments
      setComments(data.slice(0, 10)); // Show latest 10
    } catch (err) {
      console.error('মন্তব্য লোড করতে ব্যর্থ:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !comment) {
      toast.error('নাম এবং মন্তব্য দিন');
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment({ name, email: email || undefined, comment });
      toast.success('আপনার মন্তব্য সফলভাবে জমা হয়েছে! অনুমোদনের পর প্রদর্শিত হবে।');
      setName('');
      setEmail('');
      setComment('');
      loadComments();
    } catch (err) {
      console.error(err);
      toast.error('মন্তব্য জমা দিতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    
    return date.toLocaleDateString('bn-BD', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          শ্রোতাদের মন্তব্য
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* মন্তব্য ফর্ম */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">নাম *</Label>
              <Input 
                id="name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="আপনার নাম"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">ইমেইল (ঐচ্ছিক)</Label>
              <Input 
                id="email"
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="comment">মন্তব্য *</Label>
            <Textarea 
              id="comment"
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="আপনার মন্তব্য লিখুন..."
              rows={3}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting ? 'জমা হচ্ছে...' : (
              <>
                <Send className="w-4 h-4" />
                মন্তব্য জমা দিন
              </>
            )}
          </Button>
        </form>

        {/* মন্তব্য তালিকা */}
        <div className="space-y-3">
          {comments.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-card rounded-lg border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.comment}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
