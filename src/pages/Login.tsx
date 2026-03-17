import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('দয়া করে ইউজারনেম এবং পাসওয়ার্ড দিন');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithUsername(username, password);
    setIsLoading(false);

    if (error) {
      toast.error('লগিন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
      console.error(error);
    } else {
      toast.success('সফলভাবে লগিন হয়েছে!');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <Radio className="text-primary-foreground w-10 h-10" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">টাঙ্গাইল রেডিও অ্যাডমিন</CardTitle>
          <p className="text-sm text-muted-foreground">লগিন করে ম্যানেজমেন্ট প্যানেলে প্রবেশ করুন</p>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ইউজারনেম</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  লগিন করা হচ্ছে...
                </>
              ) : (
                'লগিন করুন'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
