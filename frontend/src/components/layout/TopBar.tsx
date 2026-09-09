import React from 'react';
import { Bell, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

interface TopBarProps {
  unreadAlertsCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ unreadAlertsCount = 0 }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-vppt-surface/90 backdrop-blur border-b border-vppt-border/80 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Left indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-vppt-card border border-vppt-border text-[11px] text-vppt-ash font-mono">
          <span className="w-2 h-2 rounded-full bg-[#6F8F72] animate-pulse"></span>
          <span className="uppercase tracking-wider">SYSTEM STATUS: ONLINE</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-4">
        {/* Alert Bell */}
        <Link
          to="/alerts"
          className="relative p-2 rounded text-vppt-ash hover:text-vppt-gold hover:bg-vppt-card transition-colors border border-transparent hover:border-vppt-border"
          title="Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-vppt-gold rounded-full ring-2 ring-vppt-surface animate-ping"></span>
          )}
        </Link>

        {/* User Badge */}
        <div className="flex items-center space-x-2 pl-3 border-l border-vppt-border">
          <Activity className="w-3.5 h-3.5 text-vppt-gold/70" />
          <span className="text-xs font-cinzel text-vppt-ivory tracking-wide uppercase">
            {user?.roleName || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};
