import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsersApi, createUserApi, updateUserApi, resetUserPasswordApi } from '../api/users.api';
import { Modal, FormField, Input, Select, Button, Skeleton } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const roleBadge = {
  SUPER_ADMIN: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1', label: 'Super admin' },
  ADMIN: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'Admin' },
  USER: { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8', label: 'User' },
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsersApi(),
  });

  const createMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTempPassword(data.tempPassword);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => updateUserApi(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id) => resetUserPasswordApi(id),
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
    },
  });

  const users = data?.users || [];
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'USER' });

  const handleInvite = (e) => {
    e.preventDefault();
    createMutation.mutate(inviteForm);
    setInviteForm({ name: '', email: '', role: 'USER' });
    setInviteOpen(false);
  };

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>User management</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Invite user
          </span>
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={stagger.item}>
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </motion.div>

      {/* Users Table */}
      <motion.div variants={stagger.item} className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} height="60px" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['User', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-xs font-medium px-5 py-4" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const badge = roleBadge[u.role] || roleBadge.USER;
                  return (
                    <motion.tr key={u.id}
                      className="transition-colors hover:bg-[rgba(99,102,241,0.03)]"
                      style={{ borderBottom: '1px solid var(--border-color)', opacity: u.isActive ? 1 : 0.5 }}
                      initial={{ opacity: 0 }} animate={{ opacity: u.isActive ? 1 : 0.5 }}
                      transition={{ delay: i * 0.03 }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white">
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? '' : ''}`}
                          style={{
                            background: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                            color: u.isActive ? '#10B981' : '#F43F5E',
                          }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'pulse-dot' : ''}`}
                            style={{ background: u.isActive ? '#10B981' : '#F43F5E' }} />
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button title="Toggle active" onClick={() => updateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(99,102,241,0.1)]"
                            style={{ color: 'var(--text-secondary)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              {u.isActive ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                            </svg>
                          </button>
                          <button title="Reset password" onClick={() => resetPwMutation.mutate(u.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(245,158,11,0.1)]"
                            style={{ color: 'var(--text-secondary)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Invite User Modal */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user">
        <form onSubmit={handleInvite} className="space-y-4">
          <FormField label="Full name">
            <Input placeholder="John Smith" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required />
          </FormField>
          <FormField label="Email">
            <Input type="email" placeholder="john@company.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
          </FormField>
          <FormField label="Role">
            <Select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit">Create user</Button>
          </div>
        </form>
      </Modal>

      {/* Temp Password Modal */}
      <Modal isOpen={!!tempPassword} onClose={() => setTempPassword('')} title="Temporary password">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            The user has been created. Copy the temporary password below — it will only be shown once.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <code className="flex-1 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{tempPassword}</code>
            <button onClick={() => navigator.clipboard.writeText(tempPassword)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white">
              Copy
            </button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setTempPassword('')}>Done</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
