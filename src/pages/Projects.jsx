import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { StatusBadge, SkeletonCard, EmptyState, Modal, FormField, Input, Select, Button } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const colorOptions = [
  '#6366F1', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#10B981',
];

function AddProjectModal({ isOpen, onClose }) {
  const addProject = useStore((s) => s.addProject);
  const [form, setForm] = useState({
    name: '', description: '', startDate: '', endDate: '', budget: 10000, colorTag: '#6366F1', status: 'planning',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End must be after start';
    if (form.budget < 0) errs.budget = 'Budget cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addProject({
      name: form.name.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget),
      colorTag: form.colorTag,
      status: form.status,
    });
    setForm({ name: '', description: '', startDate: '', endDate: '', budget: 10000, colorTag: '#6366F1', status: 'planning' });
    setErrors({});
    onClose();
  };

  const duration = form.startDate && form.endDate
    ? differenceInCalendarDays(new Date(form.endDate + 'T00:00:00'), new Date(form.startDate + 'T00:00:00'))
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project Name" error={errors.name}>
          <Input placeholder="e.g., Website Redesign" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Description (optional)">
          <Input placeholder="Brief project description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" error={errors.startDate}>
            <Input type="date" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
          <FormField label="End Date" error={errors.endDate}>
            <Input type="date" value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </FormField>
        </div>
        {duration !== null && duration > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Duration: {duration} days ({Math.ceil(duration / 7)} weeks)
          </motion.p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
          </FormField>
          <FormField label="Total Budget ($)" error={errors.budget}>
            <Input type="number" min="0" step="100" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })} />
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
          <Button type="submit">Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { projects, resources, assignments } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const loading = useLoadingState(600);

  let filtered = [...projects];
  if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
  if (resourceFilter !== 'all') {
    const projIds = assignments.filter(a => a.resourceId === resourceFilter).map(a => a.projectId);
    filtered = filtered.filter(p => projIds.includes(p.id));
  }

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Project
          </span>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item} className="flex gap-3 flex-wrap">
        <Select className="!w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </Select>
        <Select className="!w-auto" value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
          <option value="all">All Resources</option>
          {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📁" title="No projects found"
          description={projects.length === 0 ? "Create your first project to get started." : "Try adjusting your filters."}
          actionLabel={projects.length === 0 ? "Create Project" : undefined}
          onAction={projects.length === 0 ? () => setModalOpen(true) : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {filtered.map((p, i) => {
            const projAssignments = assignments.filter(a => a.projectId === p.id);
            const assignedResources = [...new Set(projAssignments.map(a => a.resourceId))];
            const duration = differenceInCalendarDays(
              new Date(p.endDate + 'T00:00:00'), new Date(p.startDate + 'T00:00:00')
            );
            const elapsed = differenceInCalendarDays(new Date(), new Date(p.startDate + 'T00:00:00'));
            const progress = Math.max(0, Math.min(100, Math.round((elapsed / duration) * 100)));

            return (
              <motion.div key={p.id} className="glass-card cursor-pointer group" variants={stagger.item}
                style={{ padding: '28px 32px' }}
                whileHover={{ y: -4 }} onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.colorTag }} />
                    <h3 className="truncate transition-colors" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
                      {p.name}
                    </h3>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && (
                  <p className="line-clamp-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '12px' }}>{p.description}</p>
                )}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {format(new Date(p.startDate + 'T00:00:00'), 'MMM d')} – {format(new Date(p.endDate + 'T00:00:00'), 'MMM d, yyyy')}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({duration} days)</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{p.status === 'completed' ? 100 : progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: p.colorTag }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.status === 'completed' ? 100 : progress}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {assignedResources.slice(0, 4).map(rid => {
                      const r = resources.find(res => res.id === rid);
                      if (!r) return null;
                      return (
                        <div key={rid} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: r.colorTag, border: '2px solid var(--bg-card)' }}>
                          {r.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      );
                    })}
                    {assignedResources.length > 4 && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '2px solid var(--bg-card)' }}>
                        +{assignedResources.length - 4}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{assignedResources.length} resource{assignedResources.length !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
