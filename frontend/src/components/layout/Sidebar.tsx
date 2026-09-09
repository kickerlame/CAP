import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  ShoppingCart,
  Boxes,
  Coins,
  BarChart3,
  Bell,
  LogOut,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

interface SidebarProps {
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadAlertsCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/vendors', label: 'Vendors', icon: ShieldCheck },
    { to: '/procurement', label: 'Procurement', icon: ShoppingCart },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/budgets', label: 'Budgets', icon: Coins },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-vppt-surface border-r border-vppt-border flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-vppt-border/60 flex items-center space-x-3 bg-gradient-to-r from-vppt-surface to-vppt-card">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-vppt-gold via-vppt-gold2 to-black flex items-center justify-center border border-vppt-gold/50 shadow-md">
          <Crosshair className="w-4 h-4 text-black stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-cinzel font-bold tracking-widest text-vppt-ivory">VPPT</div>
          <div className="text-[10px] uppercase font-cinzel tracking-wider text-vppt-gold/80">Procurement Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-cinzel uppercase tracking-widest text-vppt-ash/50 font-semibold">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-vppt-elevated text-vppt-gold border-l-2 border-vppt-gold shadow-sm font-semibold'
                    : 'text-vppt-ash hover:text-vppt-ivory hover:bg-vppt-card/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-vppt-gold' : 'text-vppt-ash/70 group-hover:text-vppt-ivory'
                      }`}
                    />
                    <span className="tracking-wide uppercase font-cinzel text-[11px]">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-vppt-critical/30 border border-vppt-critical/50 text-red-300">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${
                        isActive ? 'opacity-100 translate-x-0 text-vppt-gold' : 'text-vppt-ash/40'
                      }`}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-vppt-border/60 bg-vppt-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-vppt-elevated border border-vppt-gold/30 flex items-center justify-center text-xs font-cinzel font-bold text-vppt-gold flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-vppt-ivory truncate">{user?.fullName || 'User'}</p>
              <p className="text-[10px] uppercase font-cinzel text-vppt-ash/60 truncate">{user?.roleName || 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-vppt-ash hover:text-vppt-critical hover:bg-vppt-surface rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
