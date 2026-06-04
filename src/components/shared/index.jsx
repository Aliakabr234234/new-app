import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: 'var(--radius-md)',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
      <div className="flex items-center gap-3">
        <Skeleton width="48px" height="48px" className="rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height="16px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      <Skeleton height="8px" />
      <div className="flex gap-2">
        <Skeleton width="80px" height="24px" />
        <Skeleton width="60px" height="24px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass-card space-y-3" style={{ padding: '28px 32px' }}>
      <Skeleton width="40%" height="14px" />
      <Skeleton width="60%" height="32px" />
      <Skeleton width="80%" height="8px" />
    </div>
  );
}

export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div
        className="w-20 h-20 flex items-center justify-center mb-6"
        style={{
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <span className="text-4xl">{icon}</span>
      </div>
      <h3
        className="font-semibold mb-2"
        style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '24rem', marginBottom: '24px' }}>
        {description}
      </p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="btn-press font-medium transition-all duration-200"
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '520px' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ padding: '24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-10 w-full overflow-y-auto"
            style={{
              padding: '36px',
              maxWidth,
              maxHeight: '90vh',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StatusBadge({ status }) {
  const config = {
    active: { bg: 'var(--success-bg)', color: 'var(--success-text)', border: 'var(--success)', label: 'Active', pulse: true },
    planning: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning)', label: 'Planning', pulse: false },
    completed: { bg: 'var(--accent-subtle)', color: 'var(--accent)', border: 'var(--accent)', label: 'Completed', pulse: false },
    available: { bg: 'var(--success-bg)', color: 'var(--success-text)', border: 'var(--success)', label: 'Available', pulse: false },
    partial: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning)', label: 'Partially Busy', pulse: false },
    busy: { bg: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'var(--danger)', label: 'Fully Booked', pulse: true },
  };

  const c = config[status] || config.active;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}20`,
        padding: '3px 10px',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semi)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className={`rounded-full ${c.pulse ? 'pulse-dot' : ''}`}
        style={{ width: '6px', height: '6px', background: c.color }}
      />
      {c.label}
    </span>
  );
}

export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = React.useState(false);
  const ref = React.useRef(null);

  const positionMap = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      ref={ref}
    >
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.div
            className={`absolute ${positionMap[position]} z-50 pointer-events-none`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="whitespace-nowrap shadow-xl"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FormField({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
      <label
        className="block"
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semi)',
          color: 'var(--text-primary)',
        }}
      >
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-text)', marginTop: '4px' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full outline-none transition-all duration-200 ${className}`}
      style={{
        padding: '10px 14px',
        fontSize: 'var(--text-base)',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-input)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        lineHeight: 'var(--leading-normal)',
        fontFamily: 'var(--font-body)',
      }}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full outline-none transition-all duration-200 ${className}`}
      style={{
        padding: '10px 14px',
        fontSize: 'var(--text-base)',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-input)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#FFFFFF',
      border: '1px solid var(--accent)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger-text)',
      border: '1px solid var(--danger)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      className={`btn-press font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 ${className}`}
      style={{
        padding: '9px 20px',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-semi)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        ...v,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Error Boundary
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className="flex items-center justify-center mb-4"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--danger-bg)',
            }}
          >
            <span className="text-3xl">⚠️</span>
          </div>
          <h3
            className="mb-2"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semi)',
              color: 'var(--text-primary)',
            }}
          >
            Something went wrong
          </h3>
          <p
            className="mb-4"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { default as GlobalSearch } from './GlobalSearch';
