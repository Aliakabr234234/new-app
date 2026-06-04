import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Modal, FormField, Input, Select, Button, EmptyState } from '../components/shared';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

const leaveTypes = ['VACATION', 'SICK', 'TRAINING', 'OTHER'];
const leaveColors = { VACATION: '#14B8A6', SICK: '#FB7185', PUBLIC_HOLIDAY: '#A78BFA', TRAINING: '#F59E0B', OTHER: '#94A3B8' };
const leaveLabels = { VACATION: 'Vacation', SICK: 'Sick Day', PUBLIC_HOLIDAY: 'Holiday', TRAINING: 'Training', OTHER: 'Other' };

function AddLeaveModal({ isOpen, onClose }) {
  const { resources, addLeave } = useStore();
  const [form, setForm] = useState({ resourceId: '', type: 'VACATION', startDate: '', endDate: '', note: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.resourceId) errs.resourceId = 'Select a resource';
    if (!form.startDate) errs.startDate = 'Required';
    if (!form.endDate) errs.endDate = 'Required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End must be after start';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const workingDays = form.startDate && form.endDate ? eachDayOfInterval({
      start: new Date(form.startDate + 'T00:00:00'), end: new Date(form.endDate + 'T00:00:00')
    }).filter(d => ![0, 6].includes(d.getDay())).length : 0;

    addLeave({ resourceId: form.resourceId, type: form.type, startDate: form.startDate, endDate: form.endDate, note: form.note, createdById: 'current-user', approved: true });
    setForm({ resourceId: '', type: 'VACATION', startDate: '', endDate: '', note: '' });
    onClose();
  };

  const workingDays = form.startDate && form.endDate ? eachDayOfInterval({
    start: new Date(form.startDate + 'T00:00:00'), end: new Date(form.endDate + 'T00:00:00')
  }).filter(d => ![0, 6].includes(d.getDay())).length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Leave">
      <form onSubmit={handleSubmit}>
        <FormField label="Resource *" error={errors.resourceId}>
          <Select value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}>
            <option value="">Select resource...</option>
            {useStore.getState().resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Type">
          <div className="flex gap-2 flex-wrap">
            {leaveTypes.map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className="btn-press" style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)',
                  background: form.type === t ? leaveColors[t] + '25' : 'var(--bg-secondary)',
                  color: form.type === t ? leaveColors[t] : 'var(--text-secondary)',
                  border: `1px solid ${form.type === t ? leaveColors[t] : 'var(--border-default)'}`,
                  cursor: 'pointer', fontWeight: 'var(--weight-medium)',
                }}>{leaveLabels[t]}</button>
            ))}
          </div>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date *" error={errors.startDate}>
            <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
          <FormField label="End Date *" error={errors.endDate}>
            <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </FormField>
        </div>
        {workingDays > 0 && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            This is <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{workingDays} working day{workingDays !== 1 ? 's' : ''}</span>
          </div>
        )}
        <FormField label="Note (optional)">
          <Input placeholder="Optional note..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        </FormField>
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '28px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Leave</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Leave() {
  const loading = useLoadingState(400);
  const { resources, leaves, publicHolidays } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLeaveForDay = (resourceId, dateStr) => {
    return leaves.find(l => l.resourceId === resourceId && dateStr >= l.startDate && dateStr <= l.endDate);
  };
  const isHoliday = (dateStr) => publicHolidays.some(h => h.date === dateStr);

  const leavesThisMonth = leaves.filter(l => l.startDate <= format(monthEnd, 'yyyy-MM-dd') && l.endDate >= format(monthStart, 'yyyy-MM-dd'));
  const resourcesOnLeave = [...new Set(leavesThisMonth.map(l => l.resourceId))];

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="leave-management">
        Track team leave and time off. Leave days are automatically excluded from utilization calculations across the entire app.
      </InfoBanner>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Leave & Time Off</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{leavesThisMonth.length} leave entries this month</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Leave
          </span>
        </Button>
      </motion.div>

      {/* Month navigation */}
      <motion.div variants={stagger.item} className="flex items-center gap-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-press"
          style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', minWidth: '160px', textAlign: 'center' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-press"
          style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </motion.div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <motion.div variants={stagger.item} className="glass-card flex-1 overflow-x-auto" style={{ padding: 0 }}>
          {resources.length === 0 ? (
            <EmptyState icon="🏖️" title="No resources yet" description="Add resources first to manage their leave." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: days.length * 32 + 180 }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, minWidth: 160 }}>
                    Resource
                  </th>
                  {days.map(d => {
                    const isWknd = [0, 6].includes(d.getDay());
                    return (
                      <th key={d.toISOString()} style={{
                        padding: '6px 2px', textAlign: 'center', fontSize: '10px', fontWeight: 'var(--weight-medium)',
                        color: isWknd ? 'var(--text-muted)' : 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-subtle)', minWidth: 28,
                        background: isWknd ? 'var(--bg-secondary)' : undefined,
                      }}>
                        <div>{format(d, 'EEE').charAt(0)}</div>
                        <div>{format(d, 'd')}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 16px', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: resource.colorTag, fontSize: '9px' }}>
                          {resource.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{resource.name}</span>
                      </div>
                    </td>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isWknd = [0, 6].includes(d.getDay());
                      const leave = getLeaveForDay(resource.id, dateStr);
                      const holiday = isHoliday(dateStr);
                      return (
                        <td key={d.toISOString()} style={{
                          padding: '4px 2px', textAlign: 'center',
                          background: isWknd ? 'var(--bg-secondary)' : leave ? leaveColors[leave.type] + '30' : holiday ? leaveColors.PUBLIC_HOLIDAY + '30' : undefined,
                        }}>
                          {(leave || holiday) && (
                            <div style={{ width: 20, height: 20, borderRadius: '4px', margin: '0 auto', background: leave ? leaveColors[leave.type] : leaveColors.PUBLIC_HOLIDAY, opacity: 0.8 }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Right sidebar summary */}
        <motion.div variants={stagger.item} className="glass-card shrink-0" style={{ padding: '20px', width: 240 }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '16px' }}>This Month</h3>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', marginBottom: '4px' }}>{leavesThisMonth.length}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '20px' }}>leave entries</div>

          {resourcesOnLeave.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>On Leave</div>
              {resourcesOnLeave.map(rid => {
                const r = resources.find(res => res.id === rid);
                return r && (
                  <div key={rid} className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: r.colorTag, fontSize: '8px', fontWeight: 700 }}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{r.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Legend</div>
            {Object.entries(leaveLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '3px', background: leaveColors[key] }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AddLeaveModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
