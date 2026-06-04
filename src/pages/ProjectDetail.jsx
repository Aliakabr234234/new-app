import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Button, StatusBadge, Modal, FormField, Input, Select, Skeleton, EmptyState } from '../components/shared';
import Tabs from '../components/shared/Tabs';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

function AddAssignmentModal({ isOpen, onClose, project }) {
  const { resources, assignments, addAssignment, projectSkills, resourceSkills } = useStore();
  const pSkills = projectSkills.filter(ps => ps.projectId === project?.id);
  const [form, setForm] = useState({ resourceId: '', dailyHours: 2, startDate: project?.startDate || '', endDate: project?.endDate || '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.resourceId) errs.resourceId = 'Select a resource';
    if (form.dailyHours < 0.5 || form.dailyHours > 24) errs.dailyHours = 'Must be 0.5-24 hours';
    if (!form.startDate) errs.startDate = 'Required';
    if (!form.endDate) errs.endDate = 'Required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End must be after start';
    if (form.startDate && project && form.startDate < project.startDate) errs.startDate = 'Must be within project dates';
    if (form.endDate && project && form.endDate > project.endDate) errs.endDate = 'Must be within project dates';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addAssignment({
      projectId: project.id,
      resourceId: form.resourceId,
      startDate: form.startDate,
      endDate: form.endDate,
      dailyHours: Number(form.dailyHours),
    });
    onClose();
    setForm({ resourceId: '', dailyHours: 2, startDate: project?.startDate || '', endDate: project?.endDate || '' });
    setErrors({});
  };

  const workingDays = form.startDate && form.endDate
    ? eachDayOfInterval({ start: new Date(form.startDate + 'T00:00:00'), end: new Date(form.endDate + 'T00:00:00') })
      .filter(d => ![0, 6].includes(d.getDay())).length
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Resource Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Resource" error={errors.resourceId}>
          <Select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}>
            <option value="">Select a resource...</option>
            {resources.map(r => {
              // Calculate skill match
              let matchLabel = '';
              if (pSkills.length > 0) {
                const rSkillIds = resourceSkills.filter(rs => rs.resourceId === r.id).map(rs => rs.skillId);
                const reqSkillIds = pSkills.filter(ps => ps.required).map(ps => ps.skillId);
                const matchCount = reqSkillIds.filter(id => rSkillIds.includes(id)).length;
                if (reqSkillIds.length === 0) matchLabel = ' — No reqs';
                else if (matchCount === reqSkillIds.length) matchLabel = ' — ✅ Full match';
                else if (matchCount > 0) matchLabel = ` — ⚠️ Partial (${matchCount}/${reqSkillIds.length})`;
                else matchLabel = ' — ❌ No match';
              }
              return <option key={r.id} value={r.id}>{r.name} — {r.role}{matchLabel}</option>;
            })}
          </Select>
        </FormField>
        <FormField label="Daily Hours" error={errors.dailyHours}>
          <Input type="number" min="0.5" max="24" step="0.5" value={form.dailyHours}
            onChange={(e) => setForm({ ...form, dailyHours: e.target.value })} />
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
        {workingDays > 0 && form.dailyHours > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}>
            {workingDays} working days × {form.dailyHours}h/day = <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{(workingDays * Number(form.dailyHours)).toFixed(0)}h total</span>
          </motion.div>
        )}
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '28px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Assignment</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loading = useLoadingState(600);
  const { projects, resources, assignments, getProjectAssignments, deleteAssignment, projectSkills, skills, addProjectSkill, deleteProjectSkill, getProjectBudget } = useStore();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px' }}>Project not found</h2>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const projectAssignments = getProjectAssignments(project.id);
  const duration = differenceInCalendarDays(
    new Date(project.endDate + 'T00:00:00'), new Date(project.startDate + 'T00:00:00')
  );
  const projectStart = new Date(project.startDate + 'T00:00:00');
  const projectEnd = new Date(project.endDate + 'T00:00:00');

  // Pie chart data
  const pieData = projectAssignments.map(a => ({
    name: a.resource?.name || 'Unknown',
    value: a.totalHours,
    color: a.resource?.colorTag || '#666',
  }));

  const pSkills = projectSkills.filter(ps => ps.projectId === project.id).map(ps => ({ ...ps, skill: skills.find(s => s.id === ps.skillId) }));
  const budgetData = getProjectBudget ? getProjectBudget(project.id) : null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Required Skills' },
    { id: 'budget', label: 'Budget & Cost' },
  ];

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-1 mb-4 transition-colors"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Projects
        </button>
      </motion.div>

      {/* Header */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: project.colorTag + '25' }}>
              <div className="w-6 h-6 rounded-full" style={{ background: project.colorTag }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{project.name}</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {format(projectStart, 'MMM d, yyyy')} – {format(projectEnd, 'MMM d, yyyy')}
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({duration} days)</span>
              </p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '16px' }}>{project.description}</p>
        )}
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {activeTab === 'overview' && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '20px' }}>
          {/* Assignments Table */}
          <motion.div variants={stagger.item} className="glass-card lg:col-span-2" style={{ padding: '28px 32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Resource Assignments</h2>
              <Button onClick={() => setAssignModalOpen(true)} className="text-sm">
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add Assignment
                </span>
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} height="60px" />)}</div>
            ) : projectAssignments.length === 0 ? (
              <EmptyState icon="👤" title="No assignments yet"
                description="Assign resources to this project to start tracking utilization."
                actionLabel="Add Assignment" onAction={() => setAssignModalOpen(true)} />
            ) : (
              <div className="space-y-3">
                {projectAssignments.map((a, i) => {
                  const aStart = new Date(a.startDate + 'T00:00:00');
                  const aEnd = new Date(a.endDate + 'T00:00:00');
                  const leftPct = Math.max(0, (differenceInCalendarDays(aStart, projectStart) / duration) * 100);
                  const widthPct = Math.min(100 - leftPct, ((differenceInCalendarDays(aEnd, aStart) + 1) / duration) * 100);

                  return (
                    <motion.div key={a.id} style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                    }}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: a.resource?.colorTag || '#666' }}>
                          {a.resource?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{a.resource?.name || 'Unknown'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{a.resource?.role || ''}</div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{a.dailyHours}h/day</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{a.totalHours}h total</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteAssignment(a.id); }}
                          className="btn-press p-1.5 transition-colors"
                          style={{
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4V12C3 12.5523 3.44772 13 4 13H10C10.5523 13 11 12.5523 11 12V4"
                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                      {/* Mini Gantt Bar */}
                      <div className="h-3 rounded-full relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <motion.div className="absolute h-full rounded-full"
                          style={{ left: `${leftPct}%`, background: a.resource?.colorTag || 'var(--accent)' }}
                          initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                          transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }} />
                      </div>
                      <div className="flex justify-between mt-1.5" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{format(aStart, 'MMM d')}</span>
                        <span>{format(aEnd, 'MMM d')}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Donut Chart */}
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Hours by Resource</h2>
            {loading ? <Skeleton height="200px" /> :
            pieData.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                      formatter={(val) => [`${val}h`, 'Total Hours']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ fontSize: 'var(--text-sm)' }}>
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{d.value}h</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'skills' && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="glass-card" style={{ padding: '28px 32px' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Required Skills</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Skills needed to complete this project.</p>
            </div>
            <Button onClick={() => navigate('/skills')} variant="secondary">Manage Skills</Button>
          </div>
          
          {pSkills.length === 0 ? (
            <EmptyState icon="🎯" title="No required skills" description="This project has no specific skill requirements listed." />
          ) : (
            <div className="flex flex-wrap gap-3">
              {pSkills.map(ps => (
                <div key={ps.id} className="flex items-center gap-2" style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: ps.required ? 'var(--bg-secondary)' : 'transparent', border: '1px solid var(--border-subtle)', opacity: ps.required ? 1 : 0.7 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: ps.required ? 'var(--weight-semi)' : 'var(--weight-medium)', color: 'var(--text-primary)' }}>{ps.skill?.name || 'Unknown'}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>· {ps.required ? 'Required' : 'Nice to have'}</span>
                  <button onClick={() => deleteProjectSkill(ps.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '4px' }}>&times;</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'budget' && budgetData && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
          {budgetData.alertThresholdReached && (
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid var(--warning)', display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)', margin: 0, lineHeight: 1.5 }}>
                <strong>Budget Alert:</strong> This project has used {budgetData.percentUsed}% of its budget (${budgetData.actualCost.toLocaleString()} of ${(project.budget || 0).toLocaleString()})
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Budget', value: project.budget ? `$${project.budget.toLocaleString()}` : 'Not set', color: 'var(--text-primary)' },
              { label: 'Planned Cost', value: `$${budgetData.plannedCost.toLocaleString()}`, color: 'var(--text-primary)' },
              { label: 'Actual Cost', value: `$${budgetData.actualCost.toLocaleString()}`, color: 'var(--text-primary)' },
              { label: 'Remaining', value: project.budget ? `$${budgetData.remainingBudget.toLocaleString()}` : '—', color: budgetData.percentUsed > 90 ? 'var(--danger)' : budgetData.percentUsed > 75 ? 'var(--warning)' : 'var(--success)' },
            ].map((stat, i) => (
              <motion.div key={i} variants={stagger.item} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: stat.color }}>{stat.value}</div>
              </motion.div>
            ))}
          </div>
          
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Cost by Resource</h2>
            {budgetData.resourceBreakdown.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No resource costs to display.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th className="pb-3 font-medium">Resource</th>
                      <th className="pb-3 font-medium text-right">Rate</th>
                      <th className="pb-3 font-medium text-right">Planned Hrs</th>
                      <th className="pb-3 font-medium text-right">Actual Hrs</th>
                      <th className="pb-3 font-medium text-right">Planned Cost</th>
                      <th className="pb-3 font-medium text-right">Actual Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.resourceBreakdown.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="py-3 text-sm text-[var(--text-primary)] font-medium">{r.name}</td>
                        <td className="py-3 text-sm text-[var(--text-secondary)] text-right">${r.rate}/h</td>
                        <td className="py-3 text-sm text-[var(--text-primary)] text-right">{r.plannedHours}h</td>
                        <td className="py-3 text-sm text-[var(--text-primary)] text-right">{r.actualHours}h</td>
                        <td className="py-3 text-sm text-[var(--text-secondary)] text-right">${r.plannedCost.toLocaleString()}</td>
                        <td className="py-3 text-sm text-[var(--text-primary)] font-medium text-right">${r.actualCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <AddAssignmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        project={project}
      />
    </motion.div>
  );
}
