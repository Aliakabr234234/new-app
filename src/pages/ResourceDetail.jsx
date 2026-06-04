import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Button, StatusBadge, Skeleton, EmptyState } from '../components/shared';
import Tabs from '../components/shared/Tabs';
import ProgressRing from '../components/shared/ProgressRing';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

function getUtilColor(pct) {
  if (pct > 100) return 'var(--danger)';
  if (pct > 80) return 'var(--warning)';
  if (pct > 50) return 'var(--accent)';
  if (pct > 0) return 'var(--success)';
  return 'var(--bg-secondary)';
}

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loading = useLoadingState(600);
  const { resources, assignments, projects, getResourceUtilizationRange, getResourceMonthlyHeatmap, skills, resourceSkills, leaves, getHealthScore, addResourceSkill, updateResourceSkill, deleteResourceSkill } = useStore();
  const [activeTab, setActiveTab] = useState('overview');

  const resource = resources.find((r) => r.id === id);

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px' }}>Resource not found</h2>
        <Button onClick={() => navigate('/resources')}>Back to Resources</Button>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weeklyData = getResourceUtilizationRange(resource.id, weekStart, weekEnd);
  const heatmapData = getResourceMonthlyHeatmap(resource.id, 3);

  const resourceAssignments = assignments
    .filter((a) => a.resourceId === resource.id)
    .map((a) => {
      const project = projects.find((p) => p.id === a.projectId);
      const workdays = eachDayOfInterval({
        start: new Date(a.startDate + 'T00:00:00'),
        end: new Date(a.endDate + 'T00:00:00'),
      }).filter(d => ![0, 6].includes(d.getDay())).length;
      return { ...a, project, totalHours: a.dailyHours * workdays };
    });

  const chartData = weeklyData
    .filter(d => !d.isNonWorking)
    .map((d) => ({
      day: format(d.date, 'EEE'),
      hours: d.hoursAllocated,
      capacity: d.capacityHours,
      pct: d.utilizationPercent,
    }));

  // Group heatmap into weeks
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  // Skills
  const rSkills = resourceSkills.filter(rs => rs.resourceId === resource.id).map(rs => ({ ...rs, skill: skills.find(s => s.id === rs.skillId) }));
  
  // Leave
  const rLeaves = leaves.filter(l => l.resourceId === resource.id).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const leaveColors = { VACATION: '#14B8A6', SICK: '#FB7185', PUBLIC_HOLIDAY: '#A78BFA', TRAINING: '#F59E0B', OTHER: '#94A3B8' };
  const leaveLabels = { VACATION: 'Vacation', SICK: 'Sick Day', PUBLIC_HOLIDAY: 'Holiday', TRAINING: 'Training', OTHER: 'Other' };

  // Health Score
  const healthScore = getHealthScore ? getHealthScore(resource.id) : null;
  const scoreLabel = (s) => s >= 85 ? '🟢 Healthy' : s >= 70 ? '🟡 Watch' : s >= 50 ? '🟠 At Risk' : '🔴 Critical';
  const scoreColor = (s) => s >= 85 ? 'var(--success)' : s >= 70 ? 'var(--warning)' : s >= 50 ? '#F97316' : 'var(--danger)';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Skills' },
    { id: 'leave', label: 'Leave Calendar' },
    { id: 'health', label: 'Health Score' },
  ];

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      {/* Back + Header */}
      <motion.div variants={stagger.item}>
        <button onClick={() => navigate('/resources')}
          className="flex items-center gap-1 mb-4 transition-colors"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Resources
        </button>
      </motion.div>

      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: resource.colorTag }}>
            {resource.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{resource.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{resource.role} · {resource.dailyCapacityHours}h/day capacity · ${resource.rate || 100}/h rate</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={stagger.item}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      {activeTab === 'overview' && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
          {/* Weekly Chart */}
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Weekly Utilization</h2>
            {loading ? (
              <Skeleton height="200px" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                    formatter={(val, name) => [`${val}h`, name === 'hours' ? 'Allocated' : 'Capacity']}
                  />
                  <Bar dataKey="capacity" fill="var(--bg-secondary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.pct > 100 ? '#F43F5E' : entry.pct > 80 ? '#F59E0B' : entry.pct > 50 ? '#6366F1' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Assigned Projects */}
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Assigned Projects</h2>
            {resourceAssignments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No project assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {resourceAssignments.map((a, i) => (
                  <motion.div key={a.id} className="flex items-center gap-4 cursor-pointer transition-colors"
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                    }}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    onClick={() => navigate(`/projects/${a.projectId}`)}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.project?.colorTag || '#666' }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{a.project?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {format(new Date(a.startDate + 'T00:00:00'), 'MMM d')} – {format(new Date(a.endDate + 'T00:00:00'), 'MMM d')}
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{a.dailyHours}h/day</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{a.totalHours}h total</div>
                    {a.project && <StatusBadge status={a.project.status} />}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Heatmap */}
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Availability Heatmap (Next 3 Months)</h2>
            {loading ? (
              <Skeleton height="120px" />
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => {
                        const pct = day.utilizationPercent;
                        const color = pct > 100 ? '#F43F5E' : pct > 80 ? '#F59E0B' : pct > 50 ? '#6366F1' : pct > 0 ? '#10B981' : 'var(--bg-secondary)';
                        const opacity = day.isNonWorking ? 0.1 : Math.max(0.2, pct / 100);
                        return (
                          <motion.div key={di} className="w-4 h-4 rounded-sm cursor-pointer"
                            style={{
                              background: day.isNonWorking ? 'var(--bg-secondary)' : day.onLeave ? leaveColors[leaves.find(l => l.resourceId === resource.id && format(day.date, 'yyyy-MM-dd') >= l.startDate && format(day.date, 'yyyy-MM-dd') <= l.endDate)?.type || 'OTHER'] : color,
                              opacity: day.isNonWorking ? 0.3 : day.onLeave ? 0.8 : Math.max(0.15, opacity),
                            }}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ delay: wi * 0.02 + di * 0.01 }}
                            title={`${format(day.date, 'MMM d, yyyy')} — ${day.onLeave ? 'On Leave' : `${day.hoursAllocated}h / ${day.capacityHours}h (${Math.round(day.utilizationPercent)}%)`}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Less</span>
                  {[0, 25, 50, 80, 100].map((pct) => (
                    <div key={pct} className="w-4 h-4 rounded-sm"
                      style={{
                        background: pct > 80 ? '#6366F1' : pct > 50 ? '#6366F1' : pct > 0 ? '#10B981' : 'var(--bg-secondary)',
                        opacity: Math.max(0.15, pct / 100)
                      }} />
                  ))}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>More</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'skills' && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Skills & Competencies</h2>
              <Button onClick={() => navigate('/skills')} variant="secondary">Manage Directory</Button>
            </div>
            
            {rSkills.length === 0 ? (
              <EmptyState icon="🎯" title="No skills added" description="This resource doesn't have any skills listed yet." />
            ) : (
              <div className="flex flex-wrap gap-3">
                {rSkills.map(rs => (
                  <div key={rs.id} className="flex items-center gap-2" style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{rs.skill?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>· {rs.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'leave' && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Leave & Time Off</h2>
              <Button onClick={() => navigate('/leave')} variant="secondary">Manage Leave</Button>
            </div>
            
            {rLeaves.length === 0 ? (
              <EmptyState icon="🏖️" title="No leave history" description="No leave logged for this resource." />
            ) : (
              <div className="space-y-3">
                {rLeaves.map(l => (
                  <div key={l.id} className="flex items-center gap-4" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: leaveColors[l.type] || leaveColors.OTHER }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{leaveLabels[l.type] || l.type}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{format(new Date(l.startDate + 'T00:00:00'), 'MMM d, yyyy')} – {format(new Date(l.endDate + 'T00:00:00'), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'health' && healthScore && (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <div className="flex items-start gap-8">
              <div className="shrink-0 flex flex-col items-center">
                <ProgressRing value={healthScore.overall} size={120} strokeWidth={8}>
                  <span style={{ fontSize: '32px', fontWeight: 'var(--weight-bold)', color: scoreColor(healthScore.overall) }}>{healthScore.overall}</span>
                </ProgressRing>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: scoreColor(healthScore.overall), marginTop: '12px' }}>
                  {scoreLabel(healthScore.overall)}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px' }}>Health Score Factors</h2>
                {[
                  { label: 'Utilization Balance', value: healthScore.factors.utilizationBalance },
                  { label: 'Schedule Stability', value: healthScore.factors.scheduleStability },
                  { label: 'Burnout Risk', value: healthScore.factors.burnoutRisk },
                  { label: 'Leave Balance', value: healthScore.factors.leaveBalance },
                  { label: 'Actual vs Planned Alignment', value: healthScore.factors.actualAlignment },
                ].map((factor, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{factor.label}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{Math.round(factor.value)}/20</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: factor.value >= 16 ? 'var(--success)' : factor.value >= 10 ? 'var(--warning)' : 'var(--danger)', width: `${(factor.value / 20) * 100}%` }} />
                    </div>
                  </div>
                ))}
                
                {healthScore.recommendation && (
                  <div style={{ marginTop: '24px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid var(--warning)', display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>💡</span>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)', margin: 0, lineHeight: 1.5 }}>{healthScore.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
