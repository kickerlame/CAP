import React, { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { analyticsApi } from '../../api/analytics';

import { ErrorBoundary } from '../common/ErrorBoundary';

export const AppLayout: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchAlertsCount = useCallback(async () => {
    try {
      const res = await analyticsApi.getAlerts({ isRead: false, limit: 100 });
      if (res && res.meta) {
        setUnreadCount(res.meta.total);
      }
    } catch {
      // ignore in background
    }
  }, []);

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 30000);
    return () => clearInterval(interval);
  }, [fetchAlertsCount]);

  return (
    <div className="min-h-screen bg-vppt-bg text-vppt-ivory flex">
      {/* Fixed Sidebar */}
      <Sidebar unreadAlertsCount={unreadCount} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar unreadAlertsCount={unreadCount} />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <ErrorBoundary>
            <Outlet context={{ refreshAlerts: fetchAlertsCount }} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
