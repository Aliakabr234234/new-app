import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import useStore from '../store/useStore';
import { useCountUp, useLoadingState } from '../hooks/useAnimations';
import { Skeleton, StatSkeleton } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

function getHeatColor(pct) {
  if (pct > 100) return '#F43F5E';
  if (pct > 80) return '#6366F1';
  if (pct > 50) return '#818CF8';
  if (pct > 25) return '#A5B4FC';
  if (pct > 0) return '#C7D2FE';
  return 'var(--bg-secondary)';
}

function MetricCard({ title, value, suffix = '', color, delay = 0 }) {
  const loading = useLoadingState(600);
  const animatedValue = useCountUp(Math.round(value), 1200, delay);

  if (loading) return <StatSkeleton />;

  return (
    <motion.div className="glass-card relative overflow-hidden" style={{ padding: '28px 32px' }} variants={stagger.item}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ background: color, filter: 'blur(25px)', transform: 'translate(30%, -30%)' }} />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} className="block">{title}</span>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--text-primary)',
        marginTop: '16px',
      }}>{animatedValue}{suffix}</div>
    </motion.div>
  );
}

export default function Timeline() {
  const { resources, projects, getCompanyUtilizationByWeek, getResourceUtilizationOnDate, settings } = useStore();
  const loading = useLoadingState(600);

  const today = startOfDay(new Date());
  const [weeksToShow, setWeeksToShow] = useState(8);
  const [startDate, setStartDate] = useState(startOfWeek(today, { weekStartsOn: 1 }));

  const endDate = addDays(startDate, weeksToShow * 7 - 1);

  const weeklyData = useMemo(() => {
    return getCompanyUtilizationByWeek(startDate, endDate);
  }, [startDate, weeksToShow, resources, projects]);

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthlyData = useMemo(() => {
    return getCompanyUtilizationByWeek(monthStart, monthEnd);
  }, [resources, projects]);

  const totalMonthCapacity = monthlyData.reduce((s, w) => s + w.totalCapacity, 0);
  const totalMonthAllocated = monthlyData.reduce((s, w) => s + w.totalAllocated, 0);
  const overallUtilPct = totalMonthCapacity > 0 ? Math.round((totalMonthAllocated / totalMonthCapacity) * 100) : 0;

  const currentWeekData = weeklyData.find(w => {
    const ws = startOfWeek(today, { weekStartsOn: 1 });
    return format(w.weekStart, 'yyyy-MM-dd') === format(ws, 'yyyy-MM-dd');
  });
  const availableCount = currentWeekData
    ? currentWeekData.resourceUtilization.filter(r => {
        const pct = r.totalCapacity > 0 ? (r.totalAllocated / r.totalCapacity) * 100 : 0;
        return pct < 50;
      }).length
    : resources.length;

  const chartData = weeklyData.map(w => {
    const entry = { week: format(w.weekStart, 'MMM d') };
    w.projectBreakdown.forEach(pb => {
      entry[pb.projectName] = pb.totalHours;
    });
    entry._total = w.totalAllocated;
    entry._capacity = w.totalCapacity;
    entry._utilPct = Math.round(w.utilizationPercent);
    return entry;
  });

  const allProjectNames = [...new Set(weeklyData.flatMap(w => w.projectBreakdown.map(pb => pb.projectName)))];
  const projectColors = {};
  weeklyData.forEach(w => {
    w.projectBreakdown.forEach(pb => {
      projectColors[pb.projectName] = pb.projectColor;
    });
  });

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Universal Timeline</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Company-wide resource utilization overview</p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '20px' }}>
        <MetricCard title="Monthly Capacity" value={totalMonthCapacity} suffix="h" color="#6366F1" delay={0} />
        <MetricCard title="Hours Allocated" value={totalMonthAllocated} suffix="h" color="#10B981" delay={100} />
        <MetricCard title="Utilization" value={overallUtilPct} suffix="%" color="#8B5CF6" delay={200} />
        <MetricCard title="Available Resources" value={availableCount} color="#F59E0B" delay={300} />
      </div>

      {/* Controls */}
      <motion.div variants={stagger.item} className="glass-card flex items-center gap-4 flex-wrap" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Weeks:</span>
          {[{ label: '4W', val: 4 }, { label: '8W', val: 8 }, { label: '12W', val: 12 }].map(z => (
            <button key={z.val}
              className="btn-press transition-all duration-200"
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                background: weeksToShow === z.val ? 'var(--accent)' : 'var(--bg-secondary)',
                color: weeksToShow === z.val ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
              }}
              onClick={() => setWeeksToShow(z.val)}>
              {z.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-press p-1.5 transition-colors"
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setStartDate(addDays(startDate, -7))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="btn-press px-3 py-1.5 transition-colors"
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Today
          </button>
          <button className="btn-press p-1.5 transition-colors"
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => setStartDate(addDays(startDate, 7))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
        </span>
      </motion.div>

      {/* Heat Grid */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Resource Utilization Heat Grid</h2>
        {loading ? <Skeleton height="200px" /> : (
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Week Headers */}
              <div className="flex mb-2">
                <div style={{ width: '140px' }} className="shrink-0" />
                {weeklyData.map((w, i) => (
                  <div key={i} className="text-center" style={{ width: '64px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>
                    {format(w.weekStart, 'MMM d')}
                  </div>
                ))}
              </div>
              {/* Resource Rows */}
              {resources.map((resource, ri) => (
                <motion.div key={resource.id} className="flex items-center mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + ri * 0.04 }}>
                  <div className="shrink-0 flex items-center gap-2" style={{ width: '140px' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: resource.colorTag }}>
                      {resource.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{resource.name}</span>
                  </div>
                  {weeklyData.map((w, wi) => {
                    const ru = w.resourceUtilization.find(r => r.resourceId === resource.id);
                    const pct = ru && ru.totalCapacity > 0 ? Math.round((ru.totalAllocated / ru.totalCapacity) * 100) : 0;
                    return (
                      <motion.div key={wi}
                        className="rounded-md mx-0.5 flex items-center justify-center cursor-pointer group relative"
                        style={{
                          width: '60px', height: '28px',
                          background: getHeatColor(pct),
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + ri * 0.02 + wi * 0.02 }}
                        title={`${resource.name} — Week of ${format(w.weekStart, 'MMM d')} — ${pct}%`}>
                        <span style={{ fontSize: '9px', fontWeight: 'var(--weight-medium)', color: 'rgba(255,255,255,0.8)' }}>{pct > 0 ? `${pct}%` : ''}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Utilization:</span>
                {[{ label: '0%', color: 'var(--bg-secondary)' }, { label: '25%', color: '#C7D2FE' }, { label: '50%', color: '#A5B4FC' }, { label: '80%', color: '#818CF8' }, { label: '100%', color: '#6366F1' }, { label: '>100%', color: '#F43F5E' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="w-4 h-3 rounded-sm" style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stacked Bar Chart */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '24px' }}>Hours by Project (Weekly)</h2>
        {loading ? <Skeleton height="300px" /> : chartData.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No allocation data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
              <RechartsTooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: 'var(--text-secondary)' }}
                formatter={(val, name) => [`${val}h`, name]} />
              {allProjectNames.map((pName) => (
                <Bar key={pName} dataKey={pName} stackId="hours"
                  fill={projectColors[pName] || '#6366F1'} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* Project Legend */}
        <div className="flex gap-4 flex-wrap mt-4">
          {allProjectNames.map(pName => (
            <div key={pName} className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)' }}>
              <div className="w-3 h-3 rounded-sm" style={{ background: projectColors[pName] || '#6366F1' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{pName}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
