import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPasswordApi } from '../api/auth.api';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: 'Weak', color: 'var(--danger)', percent: 33 };
  if (score === 3) return { label: 'Fair', color: 'var(--warning)', percent: 66 };
  return { label: 'Strong', color: 'var(--success)', percent: 100 };
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(password);
  const passwordsMatch = password && confirm && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full" style={{ maxWidth: '440px', padding: '0 20px' }}>
        <div className="backdrop-blur-xl"
          style={{
            padding: '48px', background: 'var(--bg-card)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}>
          <h1 className="text-center mb-2" style={{ fontSize: '24px', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
            Set new password
          </h1>
          <p className="text-center mb-8" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters" required minLength={8}
                className="w-full outline-none transition-all"
                style={{
                  padding: '12px 16px', fontSize: 'var(--text-base)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-input)', borderRadius: 'var(--radius-md)',
                }} />
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: strength.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${strength.percent}%` }}
                      transition={{ duration: 0.3 }} />
                  </div>
                  <span className="block mt-1" style={{ fontSize: 'var(--text-xs)', color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password" required
                className="w-full outline-none transition-all"
                style={{
                  padding: '12px 16px', fontSize: 'var(--text-base)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  border: `1px solid ${confirm && !passwordsMatch ? 'var(--danger)' : 'var(--border-input)'}`,
                  borderRadius: 'var(--radius-md)',
                }} />
              {confirm && !passwordsMatch && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-text)' }}>Passwords do not match</span>
              )}
            </div>

            {error && (
              <div className="p-3 text-center" style={{
                borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)',
                color: 'var(--danger-text)', fontSize: 'var(--text-sm)',
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !passwordsMatch}
              className="w-full flex items-center justify-center transition-all disabled:opacity-50"
              style={{
                height: '48px', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)',
                background: 'var(--accent)', color: '#FFFFFF',
                border: 'none', cursor: 'pointer',
              }}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
