import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { FormField, Input, Select, Button, EmptyState } from '../components/shared';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

export default function Forecast() {
  const { resources, getForecast, simulateProject } = useStore();
  const forecast = getForecast(13);
  const [simReqs, setSimReqs] = useState([{ resourceId: '', dailyHours: 4, startDate: '', endDate: '' }]);
  const [simResult, setSimResult] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const chartData = forecast.map(w => ({
    name: w.weekLabel.replace('Week of ', ''),
    committed: w.totalCommitted,
    free: w.freeCapacity,
    capacity: w.totalCapacity,
  }));

  const runSim = () => {
    const valid = simReqs.filter(r => r.resourceId && r.startDate && r.endDate);
    if (valid.length === 0) return;
    setSimResult(simulateProject(valid));
  };

  // Auto-run simulation on change
  React.useEffect(() => {
    const valid = simReqs.filter(r => r.resourceId && r.startDate && r.endDate);
    if (valid.length > 0) setSimResult(simulateProject(valid));
    else setSimResult(null);
  }, [simReqs]);

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="forecast">
        See your team's capacity for the next 13 weeks. Use the simulator below to check if you can take on new projects.
      </InfoBanner>

      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px' }}>Capacity Forecast</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Next 13 weeks · {resources.length} resources</p>
      </motion.div>

      {/* Area chart */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Team Capacity Overview</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradCommitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFree" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', fontSize: 12 }} />
            <Area type="monotone" dataKey="committed" stackId="1" stroke="#6366F1" fill="url(#gradCommitted)" name="Committed" />
            <Area type="monotone" dataKey="free" stackId="1" stroke="#10B981" fill="url(#gradFree)" name="Free Capacity" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Expandable table */}
      <motion.div variants={stagger.item}>
        <button onClick={() => setShowTable(!showTable)} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '8px' }}>
          {showTable ? '▼ Hide' : '▶ Show'} week-by-week table
        </button>
        {showTable && (
          <div className="glass-card overflow-x-auto" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Week', 'Capacity', 'Committed', 'Free', 'Util %'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map(w => (
                  <tr key={w.weekStart} style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: w.utilPercent > 90 ? 'var(--danger-bg)' : w.utilPercent > 70 ? 'var(--warning-bg)' : undefined,
                  }}>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{w.weekLabel}</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{w.totalCapacity}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{w.totalCommitted}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--success)' }}>{w.freeCapacity}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: w.utilPercent > 90 ? 'var(--danger)' : w.utilPercent > 70 ? 'var(--warning)' : 'var(--success)' }}>{w.utilPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Simulator */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '4px' }}>Can we take on a new project?</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '20px' }}>Add resource requirements below — results update instantly.</p>

        {simReqs.map((req, i) => (
          <div key={i} className="flex gap-3 mb-3 items-end">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Resource</label>
              <Select value={req.resourceId} onChange={e => { const r = [...simReqs]; r[i].resourceId = e.target.value; setSimReqs(r); }}>
                <option value="">Select...</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Hours/day</label>
              <Input type="number" min="1" max="24" value={req.dailyHours} onChange={e => { const r = [...simReqs]; r[i].dailyHours = Number(e.target.value); setSimReqs(r); }} />
            </div>
            <div style={{ width: 140 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Start</label>
              <Input type="date" value={req.startDate} onChange={e => { const r = [...simReqs]; r[i].startDate = e.target.value; setSimReqs(r); }} />
            </div>
            <div style={{ width: 140 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>End</label>
              <Input type="date" value={req.endDate} onChange={e => { const r = [...simReqs]; r[i].endDate = e.target.value; setSimReqs(r); }} />
            </div>
          </div>
        ))}
        <button onClick={() => setSimReqs([...simReqs, { resourceId: '', dailyHours: 4, startDate: '', endDate: '' }])}
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add resource requirement</button>

        {simResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-md)', background: simResult.hasConflicts ? 'var(--danger-bg)' : 'var(--success-bg)', border: `1px solid ${simResult.hasConflicts ? 'var(--danger)' : 'var(--success)'}20` }}>
            {simResult.hasConflicts ? (
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--danger)', marginBottom: '8px' }}>⚠️ {simResult.conflicts.length} conflict{simResult.conflicts.length !== 1 ? 's' : ''} detected</div>
                {simResult.conflicts.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--danger-text)', marginBottom: '4px' }}>
                    {c.resourceName}: {c.totalHours}h on {c.date} (capacity: {c.capacity}h)
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--success)' }}>✅ All clear — no conflicts detected!</div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
