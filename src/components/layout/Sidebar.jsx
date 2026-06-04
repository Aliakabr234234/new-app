import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { useAuth } from '../../auth/useAuth';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { path: '/', label: 'Dashboard', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg> },
      { path: '/forecast', label: 'Capacity Forecast', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17L7 11L11 14L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 3H13M17 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    ],
  },
  {
    label: 'PROJECTS',
    items: [
      { path: '/projects', label: 'Projects', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4C3 3.44772 3.44772 3 4 3H8L10 5H16C16.5523 5 17 5.44772 17 6V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" stroke="currentColor" strokeWidth="1.5" /></svg> },
      { path: '/templates', label: 'Templates', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 8H17M8 8V17" stroke="currentColor" strokeWidth="1.5" /></svg> },
      { path: '/scenarios', label: 'Scenarios', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
    ],
  },
  {
    label: 'RESOURCES',
    items: [
      { path: '/resources', label: 'Resources', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M4 17C4 14.2386 6.23858 12 9 12H11C13.7614 12 16 14.2386 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
      { path: '/skills', label: 'Skills Matrix', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" /></svg> },
      { path: '/leave', label: 'Leave & Time Off', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 7H18" stroke="currentColor" strokeWidth="1.5" /><path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    ],
  },
  {
    label: 'TRACKING',
    items: [
      { path: '/timesheet', label: 'Timesheet', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6V10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
      { path: '/requests', label: 'Requests', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4H16V14L12 11H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 7H12M8 9H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>, badge: true },
    ],
  },
  {
    label: 'VIEWS',
    items: [
      { path: '/resource-view', label: 'Resource View', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M7 3V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
      { path: '/project-view', label: 'Project View', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="5" y="9" width="10" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="4" y="14" width="12" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" /></svg> },
      { path: '/timeline', label: 'Timeline', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 7H18" stroke="currentColor" strokeWidth="1.5" /><path d="M6 3V7" stroke="currentColor" strokeWidth="1.5" /><path d="M14 3V7" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="12" r="1" fill="currentColor" /><circle cx="10" cy="12" r="1" fill="currentColor" /><circle cx="13" cy="12" r="1" fill="currentColor" /></svg> },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { path: '/reports', label: 'Reports', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 3H15C15.5523 3 16 3.44772 16 4V16C16 16.5523 15.5523 17 15 17H5C4.44772 17 4 16.5523 4 16V4C4 3.44772 4.44772 3 5 3Z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 8H12M8 11H12M8 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
      { path: '/health', label: 'Health Scores', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17C10 17 3 12 3 7.5C3 5.01472 5.01472 3 7.5 3C8.87 3 10 3.77 10 3.77S11.13 3 12.5 3C14.9853 3 17 5.01472 17 7.5C17 12 10 17 10 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
    ],
  },
];

const adminNavItems = [
  { path: '/users', label: 'User Management', roles: ['SUPER_ADMIN'], icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M2 17C2 14.7909 3.79086 13 6 13H8C10.2091 13 12 14.7909 12 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M18 16C18 14.3431 16.6569 13 15 13H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
  { path: '/audit-logs', label: 'Audit Logs', roles: ['SUPER_ADMIN'], icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V4C17 3.44772 16.5523 3 16 3H14" stroke="currentColor" strokeWidth="1.5" /><rect x="7" y="2" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M7 10H13M7 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
];

function NavItem({ item, collapsed, isActive }) {
  return (
    <NavLink key={item.path} to={item.path}
      className="relative flex items-center transition-all duration-200 group"
      style={{
        color: isActive ? 'var(--nav-item-active-text)' : 'var(--text-secondary)',
        padding: '10px 12px', gap: '12px', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-base)', fontWeight: isActive ? 'var(--weight-semi)' : 'var(--weight-medium)',
        minHeight: '42px', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
      {isActive && (
        <motion.div layoutId="sidebar-active" className="absolute inset-0"
          style={{ background: 'var(--nav-item-active-bg)', borderRadius: 'var(--radius-md)' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} />
      )}
      <span className="relative z-10 shrink-0 transition-colors"
        style={{ width: '20px', height: '20px', opacity: isActive ? 1 : 0.8, color: isActive ? 'var(--accent)' : 'inherit' }}>
        {item.icon}
      </span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }} className="relative z-10 whitespace-nowrap overflow-hidden">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useStore();
  const { user, logout } = useAuth();
  const pendingRequests = useStore(s => s.resourceRequests?.filter(r => r.status === 'PENDING')?.length || 0);

  const visibleAdminItems = adminNavItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <motion.aside className="h-full flex flex-col z-20 shrink-0"
      style={{ borderRight: '1px solid var(--sidebar-border)', background: 'var(--sidebar-bg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', position: 'relative' }}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>

      {/* Logo */}
      <div className="flex items-center shrink-0"
        style={{ padding: '24px 20px 20px 20px', borderBottom: '1px solid var(--border-subtle)', gap: '12px', minHeight: '72px' }}>
        <div className="flex items-center justify-center shrink-0"
          style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--accent)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 1V17" stroke="white" strokeWidth="1.5" />
            <path d="M2 5L16 13" stroke="white" strokeWidth="1.5" />
            <path d="M16 5L2 13" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {settings.appName}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '12px 12px', gap: '2px' }}>
        {navSections.map((section, si) => (
          <React.Fragment key={section.label}>
            {si > 0 && <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 8px' }} />}
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 4px 8px',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>
            {section.items.map((item) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <div key={item.path} className="relative">
                  <NavItem item={item} collapsed={collapsed} isActive={isActive} />
                  {item.badge && pendingRequests > 0 && !collapsed && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                      style={{
                        padding: '1px 6px', borderRadius: 'var(--radius-full)',
                        fontSize: '10px', fontWeight: 'var(--weight-bold)',
                        background: 'var(--danger)', color: '#fff', lineHeight: '16px',
                      }}>{pendingRequests}</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 8px' }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 4px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  Admin
                </motion.div>
              )}
            </AnimatePresence>
            {visibleAdminItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={collapsed} isActive={location.pathname === item.path} />
            ))}
          </>
        )}

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 8px' }} />
        <NavItem item={{ path: '/settings', label: 'Settings', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M15.78 4.22L14.36 5.64M5.64 14.36L4.22 15.78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> }}
          collapsed={collapsed} isActive={location.pathname === '/settings'} />
      </nav>

      {/* Bottom Section */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px' }}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="btn-press w-full flex items-center transition-all duration-200"
          style={{ gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <motion.svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Collapse</motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex items-center cursor-pointer transition-colors"
          style={{ gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'transparent' }}
          onClick={() => navigate('/profile')}>
          <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ width: '32px', height: '32px', fontSize: '11px', background: 'linear-gradient(135deg, var(--accent), #EC4899)' }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || '??'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
                  {user?.name || 'User'}
                </div>
                <div className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {user?.role?.replace('_', ' ') || 'User'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                title="Sign out" className="p-1.5 transition-colors shrink-0"
                style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
