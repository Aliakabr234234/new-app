import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InfoBanner({ id, children }) {
  const storageKey = `rf-info-dismissed-${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }} style={{
            padding: '12px 20px', marginBottom: '20px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
            gap: '12px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
          }}>
          <span style={{ color: 'var(--info)' }}>ℹ️</span>
          <span className="flex-1">{children}</span>
          <button onClick={dismiss} style={{
            padding: '4px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
          }}>Got it ✓</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
