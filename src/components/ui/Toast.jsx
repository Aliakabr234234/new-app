import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  };

  const colors = {
    success: { border: 'var(--success)', icon: '✓' },
    error: { border: 'var(--danger)', icon: '✕' },
    warning: { border: 'var(--warning)', icon: '!' },
    info: { border: 'var(--accent)', icon: 'i' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed top-5 right-5 z-[999] flex flex-col pointer-events-none"
        style={{ gap: '8px', maxWidth: '360px' }}
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const c = colors[t.type] || colors.info;
            return (
              <motion.div key={t.id}
                className="pointer-events-auto overflow-hidden relative"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderLeft: `3px solid ${c.border}`,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '280px',
                }}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.25 }}>
                <div className="flex items-center" style={{ gap: '12px', padding: '14px 16px' }}>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: c.border }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className="flex-1"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semi)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t.message}
                  </span>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="shrink-0 p-1 transition-colors"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    ✕
                  </button>
                </div>
                {/* Progress bar */}
                <motion.div
                  style={{
                    height: '3px',
                    background: c.border,
                    borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`,
                  }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
