import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Button, EmptyState } from '../components/shared';
import Tabs from '../components/shared/Tabs';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

export default function Timesheet() {
  const loading = useLoadingState(400);
  const { resources, projects, assignments, timeLogs, upsertTimeLog, bulkUpsertTimeLogs, settings } = useStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState('day');
  const [entries, setEntries] = useState({});
  const [saved, setSaved] = useState(false);

  // Find current user's resource (first resource for demo)
  const myResource = resources[0];
  if (!myResource) return <EmptyState icon="⏱️" title="No resources" description="Create a resource to start logging time." />;

  const weekStart = startOfWeek(new Date(selectedDate + 'T00:00:00'), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(selectedDate + 'T00:00:00'), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => settings.workingDays.includes(d.getDay()));

  // Get active assignments for the selected date
  const activeAssignments = assignments.filter(a => {
    if (a.resourceId !== myResource.id) return false;
    if (viewMode === 'day') return selectedDate >= a.startDate && selectedDate <= a.endDate;
    return a.endDate >= format(weekStart, 'yyyy-MM-dd') && a.startDate <= format(weekEnd, 'yyyy-MM-dd');
  });

  const projectIds = [...new Set(activeAssignments.map(a => a.projectId))];

  const getLoggedHours = (projectId, dateStr) => {
    const key = `${projectId}-${dateStr}`;
    if (entries[key] !== undefined) return entries[key];
    const log = timeLogs.find(t => t.resourceId === myResource.id && t.projectId === projectId && t.date === dateStr);
    return log ? log.hoursLogged : '';
  };

  const getPlannedHours = (projectId, dateStr) => {
    const a = assignments.find(a => a.resourceId === myResource.id && a.projectId === projectId && dateStr >= a.startDate && dateStr <= a.endDate);
    return a ? a.dailyHours : 0;
  };

  const handleChange = (projectId, dateStr, value) => {
    setEntries(prev => ({ ...prev, [`${projectId}-${dateStr}`]: value }));
    setSaved(false);
  };

  const handleSaveAll = () => {
    Object.entries(entries).forEach(([key, value]) => {
      const [projectId, dateStr] = key.split(/-(.+)/);
      if (value !== '' && value !== undefined) {
        upsertTimeLog({ resourceId: myResource.id, projectId, date: dateStr, hoursLogged: parseFloat(value) || 0 });
      }
    });
    setEntries({});
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="timesheet">
        Log your actual hours spent on each project. Pre-filled values come from your planned assignments — just hit Save if they're accurate.
      </InfoBanner>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Timesheet</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Logging as {myResource.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs tabs={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} activeTab={viewMode} onChange={setViewMode} />
        </div>
      </motion.div>

      {/* Date picker */}
      <motion.div variants={stagger.item} className="flex items-center gap-4">
        <button onClick={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), viewMode === 'week' ? 7 : 1), 'yyyy-MM-dd'))}
          className="btn-press" style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }} />
        <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), viewMode === 'week' ? 7 : 1), 'yyyy-MM-dd'))}
          className="btn-press" style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Today
        </button>
      </motion.div>

      {projectIds.length === 0 ? (
        <EmptyState icon="⏱️" title="No assignments for this date" description="You don't have any active project assignments on this date." />
      ) : viewMode === 'day' ? (
        /* Day View */
        <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
          <div className="space-y-4">
            {projectIds.map(pid => {
              const project = projects.find(p => p.id === pid);
              const planned = getPlannedHours(pid, selectedDate);
              const logged = getLoggedHours(pid, selectedDate);
              return (
                <div key={pid} style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: project?.colorTag || '#666' }} />
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', flex: 1 }}>{project?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Planned: {planned}h</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', minWidth: 80 }}>Hours:</label>
                    <input type="number" min="0" max="24" step="0.5"
                      value={logged !== '' ? logged : planned}
                      onChange={e => handleChange(pid, selectedDate, e.target.value)}
                      style={{
                        width: 100, padding: '8px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                        color: 'var(--text-primary)', fontSize: 'var(--text-base)', textAlign: 'center',
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        /* Week View */
        <motion.div variants={stagger.item} className="glass-card overflow-x-auto" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', minWidth: 200 }}>Project</th>
                {weekDays.map(d => (
                  <th key={d.toISOString()} style={{ padding: '14px 8px', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', minWidth: 80 }}>
                    {format(d, 'EEE d')}
                  </th>
                ))}
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {projectIds.map(pid => {
                const project = projects.find(p => p.id === pid);
                let total = 0;
                return (
                  <tr key={pid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: project?.colorTag || '#666' }} />
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{project?.name}</span>
                      </div>
                    </td>
                    {weekDays.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const planned = getPlannedHours(pid, dateStr);
                      const logged = getLoggedHours(pid, dateStr);
                      const val = logged !== '' ? parseFloat(logged) || 0 : planned;
                      total += val;
                      return (
                        <td key={d.toISOString()} style={{ padding: '8px 4px', textAlign: 'center' }}>
                          <input type="number" min="0" max="24" step="0.5"
                            value={logged !== '' ? logged : planned || ''}
                            onChange={e => handleChange(pid, dateStr, e.target.value)}
                            style={{
                              width: 60, padding: '6px', borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                              color: 'var(--text-primary)', fontSize: 'var(--text-sm)', textAlign: 'center',
                            }} />
                        </td>
                      );
                    })}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>
                      {total}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Save button */}
      <motion.div variants={stagger.item} className="flex justify-end gap-3">
        {saved && (
          <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✓ Time logged for {selectedDate}
          </motion.span>
        )}
        <Button onClick={handleSaveAll}>Save All</Button>
      </motion.div>
    </motion.div>
  );
}
