import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Lock, Mail } from 'lucide-react';
import garageBg from '@assets/2024-01-28_1767248232529.png';
import logoImage from '/logo.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user);
      toast({ title: 'Login successful!' });
      setLocation('/');
    } catch (error: any) {
      toast({ 
        title: error.message || 'Login failed', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${garageBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >

      {/* Login Dialog */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Logo */}
          <div className="bg-white px-8 pt-8 pb-4 flex justify-center border-b border-slate-200">
            <img src={logoImage} alt="Auto Gamma Logo" className="h-16 object-contain" />
          </div>
          
          {/* Form Content */}
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@autogarage.com"
                    className="pl-12 h-11 text-base border border-red-200 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:ring-offset-0 transition-all bg-white"
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-11 text-base border border-red-200 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:ring-offset-0 transition-all bg-white"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-red-600/40"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-200 hidden">
              <p className="text-center text-xs text-muted-foreground">
                Demo Credentials:<br />
                <span className="font-semibold text-foreground">Autogarage@system.com</span><br />
                <span className="font-semibold text-foreground">Autogarage</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
