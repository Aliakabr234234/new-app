import React from 'react';
import { motion } from 'framer-motion';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex" style={{
      gap: '2px', padding: '3px',
      background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
    }}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="relative flex items-center justify-center gap-2 transition-colors"
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            zIndex: 1,
          }}>
          {activeTab === tab.id && (
            <motion.div layoutId="tab-active" className="absolute inset-0"
              style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }} />
          )}
          <span className="relative z-10">{tab.label}</span>
          {tab.badge != null && (
            <span className="relative z-10" style={{
              padding: '1px 6px', borderRadius: 'var(--radius-full)',
              fontSize: '10px', fontWeight: 'var(--weight-bold)',
              background: tab.badgeColor || 'var(--accent)', color: '#fff',
              lineHeight: '16px', minWidth: '18px', textAlign: 'center',
            }}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
