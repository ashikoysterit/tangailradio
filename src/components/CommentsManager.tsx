import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchComments, approveComment, deleteComment } from '@/db/api';
import { toast } from 'sonner';
import { Trash2, Check, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  name: string;
  email?: string;
  comment: string;
  approved: boolean;
  created_at: string;
}

export const CommentsManager: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchComments(false); // Get all comments including unapproved
      setComments(data);
    } catch (err) {
      console.error(err);
      toast.error('মন্তব্য লোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveComment(id);
      toast.success('মন্তব্য অনুমোদিত হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মন্তব্য অনুমোদন করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই মন্তব্যটি মুছে ফেলতে চান?')) return;
    try {
      await deleteComment(id);
      toast.success('মন্তব্য মুছে ফেলা হয়েছে');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('মন্তব্য মুছে ফেলতে ব্যর্থ হয়েছে');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">মন্তব্য ব্যবস্থাপনা</h2>
        <p className="text-sm text-muted-foreground">শ্রোতাদের মন্তব্য অনুমোদন বা মুছে ফেলুন</p>
      </div>

      <div className="grid gap-4">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={comment.approved ? 'border-green-500/20' : 'border-orange-500/20'}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="font-bold">{comment.name}</span>
                      {comment.email && (
                        <span className="text-xs text-muted-foreground">({comment.email})</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${comment.approved ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                        {comment.approved ? 'অনুমোদিত' : 'অপেক্ষমাণ'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{comment.comment}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!comment.approved && (
                      <Button variant="outline" size="sm" onClick={() => handleApprove(comment.id)} className="gap-1">
                        <Check className="w-4 h-4" /> অনুমোদন
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {comments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো মন্তব্য নেই।</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
