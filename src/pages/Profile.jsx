import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/useAuth';
import { changePasswordApi } from '../api/auth.api';
import { Button, Input, FormField } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const roleBadgeColors = {
  SUPER_ADMIN: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1' },
  ADMIN: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  USER: { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
};

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const badge = roleBadgeColors[user?.role] || roleBadgeColors.USER;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await changePasswordApi(currentPassword, newPassword);
      setMessage({ text: 'Password changed successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to change password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-6 max-w-3xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Manage your account</p>
      </motion.div>

      {/* User Info */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || '??'}
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2"
              style={{ background: badge.bg, color: badge.color }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </p>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Current password">
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password" required />
          </FormField>
          <FormField label="New password">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters" required minLength={8} />
          </FormField>
          <FormField label="Confirm new password">
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password" required />
          </FormField>
          {message.text && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-3 rounded-xl text-sm"
              style={{
                background: message.type === 'error' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                color: message.type === 'error' ? '#F43F5E' : '#10B981',
              }}>
              {message.text}
            </motion.div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change password'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
