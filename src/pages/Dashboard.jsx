import React from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { useCountUp, useLoadingState } from '../hooks/useAnimations';
import { StatusBadge, SkeletonCard, StatSkeleton, EmptyState } from '../components/shared';
import ProgressRing from '../components/shared/ProgressRing';

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

function StatCard({ title, value, suffix = '', icon, color, delay = 0 }) {
  const animatedValue = useCountUp(value, 1200, delay);
  const loading = useLoadingState(600);

  if (loading) return <StatSkeleton />;

  return (
    <motion.div
      className="glass-card relative overflow-hidden"
      style={{ padding: '24px 28px' }}
      variants={stagger.item}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: color, filter: 'blur(30px)', transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>{title}</span>
        <span className="flex items-center justify-center" style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
          background: `${color}20`,
        }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: '8px',
      }}>
        {animatedValue}{suffix}
      </div>
    </motion.div>
  );
}

function MiniBarChart({ data, color }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm min-w-[4px]"
          style={{ background: color }}
          initial={{ height: 0 }}
          animate={{ height: `${(d.value / maxVal) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const loading = useLoadingState(600);
  const {
    projects,
    resources,
    getTotalActiveProjects,
    getTotalResources,
    getWeeklyAllocatedHours,
    getOverallUtilization,
    getTopBusyResources,
    getUpcomingAvailability,
    getHealthScore,
    getVarianceStats,
  } = useStore();

  const totalActive = getTotalActiveProjects();
  const totalResources = getTotalResources();
  const weeklyHours = getWeeklyAllocatedHours();
  const topBusy = getTopBusyResources(3);
  const upcoming = getUpcomingAvailability();
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  
  // Health Score
  const teamHealth = getHealthScore ? getHealthScore('team') : { overall: 0 };
  const atRiskResources = resources
    .map(r => ({ ...r, health: getHealthScore ? getHealthScore(r.id) : null }))
    .filter(r => r.health && r.health.overall < 70)
    .sort((a, b) => a.health.overall - b.health.overall)
    .slice(0, 3);
    
  // Planned vs Actual
  const varianceData = getVarianceStats ? getVarianceStats() : null;

  return (
    <motion.div
      className="space-y-8 max-w-7xl"
      variants={stagger.container}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Welcome back. Here's your team overview.</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '20px' }}>
        <StatCard title="Total Projects" value={projects.length} icon="📁" color="#6366F1" delay={0} />
        <StatCard title="Active Resources" value={totalResources} icon="👥" color="#10B981" delay={100} />
        <StatCard title="Hours This Week" value={weeklyHours} suffix="h" icon="⏱️" color="#F59E0B" delay={200} />
        <StatCard title="Team Health Score" value={teamHealth.overall} icon="💚" color={teamHealth.overall >= 85 ? '#10B981' : teamHealth.overall >= 70 ? '#F59E0B' : '#EF4444'} delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '20px', marginTop: '24px' }}>
        {/* Top Busy Resources */}
        <motion.div variants={stagger.item} className="glass-card lg:col-span-2" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Top 3 Busiest Resources
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center" style={{ gap: '16px' }}>
                  <div className="skeleton rounded-full" style={{ width: '44px', height: '44px' }} />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : topBusy.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No resource data yet.</p>
          ) : (
            <div className="space-y-5">
              {topBusy.map((r) => (
                <div key={r.id} className="group cursor-pointer" onClick={() => navigate(`/resources/${r.id}`)}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <div className="flex items-center" style={{ gap: '12px' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ background: r.colorTag }}>
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }} className="group-hover:text-blue-500 transition-colors">
                          {r.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{r.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
                        {r.utilizationPercent}%
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {r.totalAllocated}h / {r.totalCapacity}h
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: r.utilizationPercent > 100 ? 'var(--danger)' : r.utilizationPercent > 80 ? 'var(--warning)' : 'var(--success)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(r.utilizationPercent, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* At Risk Resources */}
        <motion.div variants={stagger.item} className="glass-card flex flex-col" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px' }}>At Risk Resources</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '24px' }}>Resources with health score &lt; 70</p>
          
          {atRiskResources.length === 0 ? (
            <EmptyState icon="🟢" title="Looking good" description="No resources are currently at risk." />
          ) : (
            <div className="space-y-4">
              {atRiskResources.map(r => (
                <div key={r.id} className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/resources/${r.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: r.colorTag }}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: r.health.overall < 50 ? 'var(--danger)' : '#F97316', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                      {r.health.overall}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => navigate('/health')} style={{ width: '100%', marginTop: '8px' }}>View all health scores</Button>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>
        {/* Planned vs Actual */}
        {varianceData && (
          <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Planned vs Actual — This Month</h2>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: varianceData.variance > 0 ? 'var(--danger)' : varianceData.variance < 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                {varianceData.variance > 0 ? `+${varianceData.variance}h over plan` : varianceData.variance < 0 ? `${varianceData.variance}h under plan` : 'Exactly on plan'}
              </span>
            </div>
            {varianceData.projects.length === 0 ? (
              <EmptyState icon="⏱️" title="No time logged" description="No actual hours logged for active projects this month." />
            ) : (
              <div className="space-y-4">
                {varianceData.projects.slice(0, 4).map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{p.actual}h</span> actual / {p.planned}h planned
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', display: 'flex', overflow: 'hidden' }}>
                      <div style={{ background: '#6366F1', width: `${Math.min(100, (p.planned / Math.max(p.planned, p.actual)) * 100)}%` }} />
                      <div style={{ background: p.actual > p.planned ? 'var(--danger)' : 'var(--success)', width: `${Math.max(0, ((p.actual - p.planned) / Math.max(p.planned, p.actual)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Upcoming Availability */}
        <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Upcoming Availability
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No resources becoming free in the next 7 days.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r, i) => (
                <motion.div
                  key={r.id}
                  className="flex items-center gap-3"
                  style={{ padding: '14px 0' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                >
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
                    style={{ width: '44px', height: '44px', fontSize: '14px', background: r.colorTag }}
                  >
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Free in {r.daysUntilFree} day{r.daysUntilFree !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 'var(--weight-medium)' }}>
                    {format(new Date(r.freeDate + 'T00:00:00'), 'MMM d')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Projects */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px', marginTop: '24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Recent Projects</h2>
          <button
            onClick={() => navigate('/projects')}
            className="transition-colors"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View all →
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No projects yet"
            description="Create your first project to start tracking resources."
            actionLabel="Create Project"
            onAction={() => navigate('/projects')}
          />
        ) : (
          <div className="space-y-2">
            {recentProjects.map((p, i) => (
              <motion.div
                key={p.id}
                className="flex items-center cursor-pointer transition-colors"
                style={{ padding: '14px 0', gap: '14px', borderRadius: 'var(--radius-md)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: p.colorTag }} />
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {format(new Date(p.startDate + 'T00:00:00'), 'MMM d')} – {format(new Date(p.endDate + 'T00:00:00'), 'MMM d, yyyy')}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
