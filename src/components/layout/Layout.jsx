import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { ErrorBoundary, GlobalSearch } from '../shared';
import useStore from '../../store/useStore';

const pageTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/resources': 'Resources',
  '/resource-view': 'Resource View',
  '/project-view': 'Project View',
  '/timeline': 'Timeline',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/users': 'User Management',
  '/audit-logs': 'Audit Logs',
  '/skills': 'Skills Matrix',
  '/leave': 'Leave & Time Off',
  '/timesheet': 'Timesheet',
  '/forecast': 'Capacity Forecast',
  '/templates': 'Templates',
  '/scenarios': 'Scenario Planning',
  '/requests': 'Resource Requests',
  '/reports': 'Reports',
  '/health': 'Health Scores',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings, getConflicts, notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [conflictDrawerOpen, setConflictDrawerOpen] = useState(false);
  const notifRef = useRef(null);

  const conflicts = getConflicts ? getConflicts() : [];
  const unreadNotifs = notifications ? notifications.filter(n => !n.isRead).length : 0;

  // Click outside to close notification dropdown
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Escape') { setShowNotifs(false); setConflictDrawerOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  // Determine page title
  const pageTitle = pageTitles[location.pathname] || 'ResourceFlow';

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Header Bar */}
        <div
          className="shrink-0 flex items-center justify-between"
          style={{
            height: '60px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 32px',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {pageTitle}
            </span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }}
                aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifs > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadNotifs}</span>
                )}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    style={{ position: 'absolute', top: '44px', right: 0, width: '340px', maxHeight: '400px', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 50 }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadNotifs > 0 && (
                        <button onClick={() => markAllNotificationsRead()} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                      )}
                    </div>
                    {(!notifications || notifications.length === 0) ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No notifications</div>
                    ) : (
                      notifications.slice(0, 20).map(n => (
                        <div key={n.id} onClick={() => { markNotificationRead(n.id); if (n.linkUrl) navigate(n.linkUrl); setShowNotifs(false); }}
                          className="transition-colors cursor-pointer"
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: n.isRead ? undefined : 'var(--bg-secondary)' }}>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: n.isRead ? 'var(--weight-medium)' : 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center overflow-hidden relative"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              aria-label="Toggle Theme"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={settings.theme}
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  {settings.theme === 'light' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Conflict Banner */}
        <AnimatePresence>
          {conflicts.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ padding: '10px 32px', background: 'var(--warning-bg)', borderBottom: '1px solid var(--warning)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => navigate('/health')}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--warning-text)', flex: 1 }}>
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected — resource overallocation found this week
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)', fontWeight: 'var(--weight-semi)' }}>View details →</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: 'var(--bg-primary)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
              className="min-h-full"
              style={{ padding: '36px 48px' }}
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      <GlobalSearch />
    </div>
  );
}
