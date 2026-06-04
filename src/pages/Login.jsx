import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/useAuth';

const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.5 },
};

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-root)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'var(--accent)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: '#8B5CF6', filter: 'blur(120px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={shake ? { ...shakeAnimation, opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full"
        style={{ maxWidth: '440px', padding: '0 20px' }}
      >
        <div className="backdrop-blur-xl"
          style={{
            padding: '48px',
            background: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 flex items-center justify-center"
              style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent)' }}>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 1V17" stroke="white" strokeWidth="1.5" />
                <path d="M2 5L16 13" stroke="white" strokeWidth="1.5" />
                <path d="M16 5L2 13" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              background: 'linear-gradient(135deg, var(--accent), #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ResourceFlow
            </span>
          </div>

          <h1 className="text-center" style={{ fontSize: '24px', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Welcome back
          </h1>
          <p className="text-center" style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full outline-none transition-all"
                style={{
                  padding: '12px 16px',
                  fontSize: 'var(--text-base)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-input)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pr-12 outline-none transition-all"
                  style={{
                    padding: '12px 16px',
                    fontSize: 'var(--text-base)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-input)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                  style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-2"
                  style={{ borderColor: 'var(--border-input)', accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <Link to="/forgot-password" className="transition-colors"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--accent)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-center"
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
              style={{
                height: '48px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-semi)',
                background: 'var(--accent)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? (
                <motion.svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <path d="M10 2A8 8 0 1 0 18 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </motion.svg>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 text-center"
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border-accent)',
            }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Demo credentials</p>
            <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              superadmin@resourceflow.app / SuperAdmin@123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
