import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Modal, FormField, Input, Select, Button, EmptyState } from '../components/shared';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

function NewTemplateModal({ isOpen, onClose }) {
  const { addTemplate, addTemplateRole } = useStore();
  const [form, setForm] = useState({ name: '', description: '', durationDays: 14, colorTag: '#6366F1' });
  const [roles, setRoles] = useState([{ roleTitle: '', dailyHours: 4, startOffsetDays: 0, durationDays: 14 }]);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const tid = addTemplate({ name: form.name, description: form.description, durationDays: Number(form.durationDays), colorTag: form.colorTag });
    roles.filter(r => r.roleTitle.trim()).forEach(r => {
      addTemplateRole({ templateId: tid, roleTitle: r.roleTitle, dailyHours: Number(r.dailyHours), startOffsetDays: Number(r.startOffsetDays), durationDays: Number(r.durationDays) });
    });
    setForm({ name: '', description: '', durationDays: 14, colorTag: '#6366F1' });
    setRoles([{ roleTitle: '', dailyHours: 4, startOffsetDays: 0, durationDays: 14 }]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project Template" maxWidth="600px">
      <form onSubmit={handleSubmit}>
        <FormField label="Template Name *" error={errors.name}>
          <Input placeholder="e.g., Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Duration (days)">
          <Input type="number" min="1" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} />
        </FormField>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Roles</label>
          {roles.map((role, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input placeholder="Role title" value={role.roleTitle} onChange={e => { const r = [...roles]; r[i].roleTitle = e.target.value; setRoles(r); }} style={{ flex: 1 }} />
              <Input type="number" min="1" max="24" value={role.dailyHours} onChange={e => { const r = [...roles]; r[i].dailyHours = e.target.value; setRoles(r); }} style={{ width: 70 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>h/day</span>
            </div>
          ))}
          <button type="button" onClick={() => setRoles([...roles, { roleTitle: '', dailyHours: 4, startOffsetDays: 0, durationDays: Number(form.durationDays) }])}
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
            + Add role
          </button>
        </div>
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create Template</Button>
        </div>
      </form>
    </Modal>
  );
}

function UseTemplateModal({ isOpen, onClose, template }) {
  const { resources, templateRoles, createProjectFromTemplate } = useStore();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resourceMap, setResourceMap] = useState({});

  if (!template) return null;
  const roles = templateRoles.filter(r => r.templateId === template.id);

  const handleCreate = () => {
    if (!name.trim()) return;
    createProjectFromTemplate(template.id, name, startDate, resourceMap);
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Use Template: ${template.name}`} maxWidth="600px">
      <FormField label="Project Name *">
        <Input placeholder="New project name" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <FormField label="Start Date">
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </FormField>
      {roles.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Assign Resources (optional)</label>
          {roles.map(role => (
            <div key={role.id} className="flex items-center gap-3 mb-2">
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', minWidth: 120 }}>{role.roleTitle}</span>
              <Select value={resourceMap[role.roleTitle] || ''} onChange={e => setResourceMap({ ...resourceMap, [role.roleTitle]: e.target.value })} style={{ flex: 1 }}>
                <option value="">Unassigned</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.name} — {r.role}</option>)}
              </Select>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{role.dailyHours}h/day</span>
            </div>
          ))}
        </div>
      )}
      {/* Mini preview */}
      <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Duration: {template.durationDays} days · End date: {format(addDays(new Date(startDate + 'T00:00:00'), template.durationDays), 'MMM d, yyyy')}
      </div>
      <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate}>Create Project</Button>
      </div>
    </Modal>
  );
}

export default function Templates() {
  const loading = useLoadingState(400);
  const { templates, templateRoles, deleteTemplate } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(null);

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="templates">
        Save project structures as templates and reuse them to create new projects in seconds. Templates copy the pattern, not actual dates.
      </InfoBanner>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Project Templates</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Template
          </span>
        </Button>
      </motion.div>

      {templates.length === 0 ? (
        <EmptyState icon="📋" title="No templates yet" description="Create a template to save time when setting up similar projects."
          actionLabel="New Template" onAction={() => setNewOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {templates.map((t, i) => {
            const roles = templateRoles.filter(r => r.templateId === t.id);
            return (
              <motion.div key={t.id} className="glass-card" style={{ padding: '24px 28px' }}
                variants={stagger.item} whileHover={{ y: -4 }}>
                <div className="flex items-start gap-3 mb-4">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.colorTag, marginTop: 6 }} />
                  <div className="flex-1">
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t.durationDays} days</div>
                  </div>
                </div>
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {roles.map(r => (
                      <span key={r.id} style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px',
                        background: 'var(--accent-subtle)', color: 'var(--accent)', fontWeight: 'var(--weight-medium)',
                      }}>{r.roleTitle} · {r.dailyHours}h</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => setUseOpen(t)} className="flex-1">Use Template</Button>
                  <Button variant="danger" onClick={() => deleteTemplate(t.id)} style={{ padding: '9px 12px' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M5 4V2H9V4M3 4V12C3 12.5523 3.44772 13 4 13H10C10.5523 13 11 12.5523 11 12V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <NewTemplateModal isOpen={newOpen} onClose={() => setNewOpen(false)} />
      <UseTemplateModal isOpen={!!useOpen} onClose={() => setUseOpen(null)} template={useOpen} />
    </motion.div>
  );
}
