import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drawer({ isOpen, onClose, title, width = 420, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              width: `${width}px`, maxWidth: '90vw',
              background: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
            initial={{ x: width }} animate={{ x: 0 }} exit={{ x: width }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between shrink-0"
              style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{
                fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-heading)', color: 'var(--text-primary)',
              }}>{title}</h2>
              <button onClick={onClose} className="flex items-center justify-center"
                style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  background: 'transparent', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
