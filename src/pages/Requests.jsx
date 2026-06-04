import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { useAuth } from '../auth/useAuth';
import { useLoadingState } from '../hooks/useAnimations';
import { Modal, FormField, Input, Select, Button, EmptyState } from '../components/shared';
import Tabs from '../components/shared/Tabs';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

const statusColors = { PENDING: 'var(--warning)', APPROVED: 'var(--success)', REJECTED: 'var(--danger)', CANCELLED: 'var(--text-muted)' };

function NewRequestModal({ isOpen, onClose }) {
  const { projects, resources, addRequest } = useStore();
  const { user } = useAuth();
  const [form, setForm] = useState({ projectId: '', resourceId: '', startDate: '', endDate: '', dailyHours: 4, justification: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.projectId) errs.projectId = 'Required';
    if (!form.resourceId) errs.resourceId = 'Required';
    if (!form.startDate) errs.startDate = 'Required';
    if (!form.endDate) errs.endDate = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    addRequest({ ...form, dailyHours: Number(form.dailyHours), requestedById: user?.id || 'current-user' });
    setForm({ projectId: '', resourceId: '', startDate: '', endDate: '', dailyHours: 4, justification: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Resource Request" maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <FormField label="Project *" error={errors.projectId}>
          <Select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Resource *" error={errors.resourceId}>
          <Select value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}>
            <option value="">Select resource...</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name} — {r.role}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date *" error={errors.startDate}>
            <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
          <FormField label="End Date *" error={errors.endDate}>
            <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Daily Hours">
          <Input type="number" min="0.5" max="24" step="0.5" value={form.dailyHours} onChange={e => setForm({ ...form, dailyHours: e.target.value })} />
        </FormField>
        <FormField label="Justification">
          <textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })}
            placeholder="Why do you need this resource?"
            rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', resize: 'vertical' }} />
        </FormField>
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const { resourceRequests, resources, projects, approveRequest, rejectRequest } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const filtered = activeTab === 'ALL' ? resourceRequests : resourceRequests.filter(r => r.status === activeTab);
  const pendingCount = resourceRequests.filter(r => r.status === 'PENDING').length;

  const handleReject = (id) => {
    if (!rejectNote.trim()) return;
    rejectRequest(id, user?.id, rejectNote);
    setRejectingId(null);
    setRejectNote('');
  };

  const tabs = [
    { id: 'PENDING', label: 'Pending', badge: pendingCount || undefined, badgeColor: 'var(--warning)' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'ALL', label: 'All' },
  ];

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="requests">
        Submit resource requests for your projects. Admins review and approve or reject with feedback.
      </InfoBanner>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Resource Requests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{pendingCount} pending</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Request
          </span>
        </Button>
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState icon="📨" title="No requests" description={activeTab === 'PENDING' ? 'No pending requests to review.' : 'No requests found.'}
          actionLabel="New Request" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const resource = resources.find(r => r.id === req.resourceId);
            const project = projects.find(p => p.id === req.projectId);
            return (
              <motion.div key={req.id} className="glass-card" style={{ padding: '20px 24px' }}
                variants={stagger.item}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: resource?.colorTag || '#666' }}>
                    {resource?.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{resource?.name || 'Unknown'}</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>for</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{project?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {req.startDate} → {req.endDate} · {req.dailyHours}h/day
                    </div>
                    {req.justification && (
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{req.justification}"</div>
                    )}
                    {req.reviewNote && (
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--danger-text)', marginTop: '4px' }}>Review: {req.reviewNote}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semi)', background: statusColors[req.status] + '20', color: statusColors[req.status],
                    }}>{req.status}</span>
                    {isAdmin && req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button onClick={() => approveRequest(req.id, user?.id)} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success)', borderColor: 'var(--success)' }}>Approve</Button>
                        <Button variant="danger" onClick={() => setRejectingId(req.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
                {rejectingId === req.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-2 mt-3" style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <Input placeholder="Reason for rejection (required)" value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)} style={{ flex: 1 }} />
                    <Button variant="danger" onClick={() => handleReject(req.id)}>Confirm</Button>
                    <Button variant="ghost" onClick={() => { setRejectingId(null); setRejectNote(''); }}>Cancel</Button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <NewRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
