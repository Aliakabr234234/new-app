import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { StatusBadge, SkeletonCard, EmptyState, Modal, FormField, Input, Select, Button } from '../components/shared';
import { startOfWeek, endOfWeek } from 'date-fns';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
};

const colorOptions = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1', '#10B981',
];

function AddResourceModal({ isOpen, onClose }) {
  const addResource = useStore((s) => s.addResource);
  const [form, setForm] = useState({ name: '', role: '', dailyCapacityHours: 8, rate: 100, colorTag: '#6366F1' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (form.dailyCapacityHours < 1 || form.dailyCapacityHours > 24) errs.dailyCapacityHours = 'Must be 1-24 hours';
    if (form.rate < 0) errs.rate = 'Rate cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addResource({
      name: form.name.trim(),
      role: form.role.trim(),
      dailyCapacityHours: Number(form.dailyCapacityHours),
      rate: Number(form.rate),
      colorTag: form.colorTag,
    });
    setForm({ name: '', role: '', dailyCapacityHours: 8, rate: 100, colorTag: '#6366F1' });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Resource">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" error={errors.name}>
          <Input placeholder="e.g., John Smith" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Role / Title" error={errors.role}>
          <Input placeholder="e.g., Frontend Developer" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Daily Capacity (hours)" error={errors.dailyCapacityHours}>
            <Input type="number" min="1" max="24" value={form.dailyCapacityHours}
              onChange={(e) => setForm({ ...form, dailyCapacityHours: e.target.value })} />
          </FormField>
          <FormField label="Hourly Rate ($)" error={errors.rate}>
            <Input type="number" min="0" value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Color Tag">
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button key={color} type="button" className="w-8 h-8 rounded-lg transition-all duration-200 border-2"
                style={{
                  background: color,
                  borderColor: form.colorTag === color ? 'var(--text-primary)' : 'transparent',
                  transform: form.colorTag === color ? 'scale(1.15)' : 'scale(1)',
                }}
                onClick={() => setForm({ ...form, colorTag: color })} />
            ))}
          </div>
        </FormField>
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '28px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Resource</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Resources() {
  const navigate = useNavigate();
  const { resources, getResourceUtilizationRange, settings, getHealthScore, getConflicts } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const loading = useLoadingState(600);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const resourcesWithUtil = resources.map((r) => {
    const utils = getResourceUtilizationRange(r.id, weekStart, weekEnd);
    const workingDays = utils.filter(u => !u.isNonWorking);
    const totalAlloc = workingDays.reduce((sum, u) => sum + u.hoursAllocated, 0);
    const totalCap = workingDays.reduce((sum, u) => sum + u.capacityHours, 0);
    const utilPercent = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
    let status = 'available';
    if (utilPercent > 80) status = 'busy';
    else if (utilPercent > 0) status = 'partial';
    
    const health = getHealthScore ? getHealthScore(r.id) : { overall: 0 };
    const conflicts = getConflicts ? getConflicts().filter(c => c.resourceId === r.id) : [];
    
    return { ...r, utilPercent, status, health, hasConflict: conflicts.length > 0 };
  });

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Resources</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{resources.length} team member{resources.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Resource
          </span>
        </Button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState icon="👤" title="No resources yet"
          description="Add team members to start tracking their availability and utilization."
          actionLabel="Add Resource" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {resourcesWithUtil.map((r, i) => (
            <motion.div key={r.id} className="glass-card cursor-pointer group"
              style={{ padding: '28px 32px' }} variants={stagger.item}
              whileHover={{ y: -4 }} onClick={() => navigate(`/resources/${r.id}`)}>
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: r.colorTag }}>
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {r.hasConflict && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-card)] bg-[var(--warning)]" title="Has conflicts this week" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate transition-colors" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{r.role}</div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Week Utilization</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{r.utilPercent}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{
                      background: r.utilPercent > 100 ? 'var(--danger)' : r.utilPercent > 80 ? 'var(--warning)' : 'var(--success)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(r.utilPercent, 100)}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5" title={`Health Score: ${r.health.overall}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: r.health.overall >= 85 ? 'var(--success)' : r.health.overall >= 70 ? 'var(--warning)' : r.health.overall >= 50 ? '#F97316' : 'var(--danger)' }}>
                    {r.health.overall}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Health</span>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{r.dailyCapacityHours}h/day</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddResourceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
