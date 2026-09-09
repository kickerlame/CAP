import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Lock, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Access denied.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-vppt-bg flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-vppt-gold/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-vppt-gold2/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-vppt-card border border-vppt-border rounded-xl shadow-2xl relative corner-accent p-8 z-10 animate-fade-in">
        {/* Brand Crest */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-vppt-gold via-vppt-gold2 to-black flex items-center justify-center border border-vppt-gold/60 shadow-lg shadow-vppt-gold/10">
            <Crosshair className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-cinzel font-bold tracking-widest text-vppt-ivory uppercase">VPPT</h1>
          <p className="text-[11px] font-cinzel uppercase tracking-widest text-vppt-gold mt-1">
            Vendor & Procurement Performance Tracker
          </p>
          <div className="divider-gold mt-4 w-3/4 mx-auto"></div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded bg-vppt-critical/20 border border-vppt-critical/40 flex items-center space-x-2 text-xs text-red-200 animate-slide-in">
            <ShieldAlert className="w-4 h-4 text-vppt-critical flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Input
                label="Username or Email"
                placeholder="Username or email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              <UserIcon className="w-4 h-4 text-vppt-ash/40 absolute right-3 top-8 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="relative">
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <Lock className="w-4 h-4 text-vppt-ash/40 absolute right-3 top-8 pointer-events-none" />
            </div>
          </div>

          <Button type="submit" variant="gold" className="w-full mt-4 py-2.5 uppercase font-cinzel" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-8 pt-6 border-t border-vppt-border/60">
          <p className="text-[10px] font-cinzel uppercase tracking-wider text-vppt-ash/60 text-center mb-3">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin.sys', 'Password@123')}
              className="px-2.5 py-2 text-left bg-vppt-surface hover:bg-vppt-elevated border border-vppt-border hover:border-vppt-gold/40 rounded transition-colors"
            >
              <div className="text-[11px] font-semibold text-vppt-gold font-cinzel">Admin</div>
              <div className="text-[10px] text-vppt-ash/60">admin.sys</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('procmgr', 'Password@123')}
              className="px-2.5 py-2 text-left bg-vppt-surface hover:bg-vppt-elevated border border-vppt-border hover:border-vppt-gold/40 rounded transition-colors"
            >
              <div className="text-[11px] font-semibold text-vppt-ivory font-cinzel">Procurement</div>
              <div className="text-[10px] text-vppt-ash/60">procmgr</div>
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[11px] font-cinzel uppercase tracking-widest text-vppt-ash/40">
        VPPT &bull; Enterprise Procurement System
      </p>
    </div>
  );
};
