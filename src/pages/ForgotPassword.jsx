import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { forgotPasswordApi } from '../api/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
        style={{ maxWidth: '440px', padding: '0 20px' }}
      >
        <div className="backdrop-blur-xl"
          style={{
            padding: '48px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}>
          
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-10 h-10 flex items-center justify-center"
                    style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                  </div>
                </div>

                <h1 className="text-center mb-2" style={{ fontSize: '24px', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
                  Forgot password?
                </h1>
                <p className="text-center mb-8" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
                  Enter your email and we'll send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Email</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com" required
                      className="w-full outline-none transition-all"
                      style={{
                        padding: '12px 16px', fontSize: 'var(--text-base)',
                        background: 'var(--bg-input)', color: 'var(--text-primary)',
                        border: '1px solid var(--border-input)', borderRadius: 'var(--radius-md)',
                      }}
                    />
                  </div>

                  {error && (
                    <div className="p-3 text-center" style={{
                      borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)',
                      color: 'var(--danger-text)', fontSize: 'var(--text-sm)',
                    }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 transition-all"
                    style={{
                      height: '48px', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)',
                      background: 'var(--accent)', color: '#FFFFFF',
                      border: 'none', cursor: 'pointer',
                    }}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>

                  <Link to="/login" className="block text-center transition-colors"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', textDecoration: 'none' }}>
                    ← Back to login
                  </Link>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center">
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                  style={{ borderRadius: 'var(--radius-xl)', background: 'var(--success-bg)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="mb-2" style={{ fontSize: '20px', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Check your email</h2>
                <p className="mb-6" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
                  If an account with <strong>{email}</strong> exists, we've sent a password reset link.
                </p>
                <Link to="/login" className="transition-colors"
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', textDecoration: 'none' }}>
                  ← Back to login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
