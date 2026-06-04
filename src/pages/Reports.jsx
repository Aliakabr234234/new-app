import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import useStore from '../store/useStore';
import { Button, Select } from '../components/shared';
import Tabs from '../components/shared/Tabs';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

const reportTypes = [
  { id: 'utilization', label: 'Utilization Report', icon: '📊' },
  { id: 'project', label: 'Project Resource Report', icon: '📁' },
  { id: 'capacity', label: 'Capacity Report', icon: '📈' },
  { id: 'leave', label: 'Leave Report', icon: '🏖️' },
  { id: 'cost', label: 'Cost Report', icon: '💰' },
  { id: 'skills', label: 'Skills Report', icon: '🎯' },
];

function UtilizationReport({ resources, getResourceUtilizationRange, settings }) {
  const now = new Date();
  const ms = startOfMonth(now);
  const me = endOfMonth(now);

  const data = resources.map(r => {
    const utils = getResourceUtilizationRange(r.id, ms, me);
    const working = utils.filter(u => !u.isNonWorking && !u.onLeave);
    const totalAlloc = working.reduce((s, u) => s + u.hoursAllocated, 0);
    const totalCap = working.reduce((s, u) => s + u.capacityHours, 0);
    return { name: r.name, util: totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0, hours: totalAlloc, capacity: totalCap, color: r.colorTag };
  }).sort((a, b) => b.util - a.util);

  return (
    <div>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>
        Utilization Report — {format(now, 'MMMM yyyy')}
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <XAxis type="number" domain={[0, 120]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
          <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', fontSize: 12 }}
            formatter={(v) => [`${v}%`, 'Utilization']} />
          <Bar dataKey="util" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.util > 100 ? '#F43F5E' : d.util > 80 ? '#F59E0B' : '#10B981'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>{['Resource', 'Allocated', 'Capacity', 'Utilization'].map(h => (
            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>{data.map(d => (
          <tr key={d.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{d.name}</td>
            <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{d.hours}h</td>
            <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{d.capacity}h</td>
            <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: d.util > 100 ? 'var(--danger)' : d.util > 80 ? 'var(--warning)' : 'var(--success)' }}>{d.util}%</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function LeaveReport({ resources, leaves }) {
  const summary = resources.map(r => {
    const rLeaves = leaves.filter(l => l.resourceId === r.id);
    return { name: r.name, total: rLeaves.length, vacation: rLeaves.filter(l => l.type === 'VACATION').length, sick: rLeaves.filter(l => l.type === 'SICK').length, training: rLeaves.filter(l => l.type === 'TRAINING').length };
  }).filter(r => r.total > 0);

  return (
    <div>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Leave Report</h3>
      {summary.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No leave data available.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Resource', 'Vacation', 'Sick', 'Training', 'Total'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>{summary.map(s => (
            <tr key={s.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{s.name}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.vacation}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.sick}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.training}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{s.total}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function SkillsReport({ resources, skills, resourceSkills }) {
  const getSkillCount = (skillId) => resourceSkills.filter(rs => rs.skillId === skillId).length;
  const sortedSkills = [...skills].sort((a, b) => getSkillCount(b.id) - getSkillCount(a.id));

  return (
    <div>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Skills Distribution</h3>
      {sortedSkills.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No skills data available.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Skill', 'Category', 'Resources'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>{sortedSkills.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{s.name}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.category}</td>
              <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{getSkillCount(s.id)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export default function Reports() {
  const store = useStore();
  const [activeReport, setActiveReport] = useState('utilization');

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const data = store.resources.map(r => ({ name: r.name, role: r.role, capacity: r.dailyCapacityHours }));
    const csv = [Object.keys(data[0] || {}).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeReport}-report.csv`; a.click();
  };

  const renderReport = () => {
    switch (activeReport) {
      case 'utilization': return <UtilizationReport {...store} />;
      case 'leave': return <LeaveReport {...store} />;
      case 'skills': return <SkillsReport {...store} />;
      case 'project': return (
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Project Resource Report</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Project', 'Status', 'Resources', 'Assignments'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{store.projects.map(p => {
              const assigns = store.assignments.filter(a => a.projectId === p.id);
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{p.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.status}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{[...new Set(assigns.map(a => a.resourceId))].length}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{assigns.length}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      );
      case 'capacity': return (
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Capacity Report (Next 13 Weeks)</h3>
          {(() => {
            const forecast = store.getForecast(13);
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Week', 'Capacity', 'Committed', 'Free', 'Utilization'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                ))}</tr></thead>
                <tbody>{forecast.map(w => (
                  <tr key={w.weekStart} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{w.weekLabel}</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{w.totalCapacity}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{w.totalCommitted}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--success)' }}>{w.freeCapacity}h</td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: w.utilPercent > 90 ? 'var(--danger)' : 'var(--text-primary)' }}>{w.utilPercent}%</td>
                  </tr>
                ))}</tbody>
              </table>
            );
          })()}
        </div>
      );
      case 'cost': return (
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '20px' }}>Cost Report</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Project', 'Budget', 'Planned Cost', 'Actual Cost', 'Remaining'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
            ))}</tr></thead>
            <tbody>{store.projects.map(p => {
              const b = store.getProjectBudget(p.id);
              return b && (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{p.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>${b.budget.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>${Math.round(b.plannedCost).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>${Math.round(b.actualCost).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: b.remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>${Math.round(b.remaining).toLocaleString()}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      );
      default: return null;
    }
  };

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="reports">
        Generate reports from your live data. Print to PDF with your browser or export as CSV.
      </InfoBanner>

      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px' }}>Reports & Export</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate and download reports</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Left nav */}
        <motion.div variants={stagger.item} className="glass-card shrink-0" style={{ padding: '12px', width: 220 }}>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className="w-full flex items-center gap-3 transition-colors"
              style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: activeReport === r.id ? 'var(--weight-semi)' : 'var(--weight-medium)',
                background: activeReport === r.id ? 'var(--accent-subtle)' : 'transparent',
                color: activeReport === r.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none', textAlign: 'left',
              }}>
              <span>{r.icon}</span>
              {r.label}
            </button>
          ))}
        </motion.div>

        {/* Report content */}
        <motion.div variants={stagger.item} className="glass-card flex-1" style={{ padding: '28px 32px' }}>
          <div className="flex items-center justify-end gap-3" style={{ marginBottom: '24px' }}>
            <Button variant="secondary" onClick={handleCSV}>
              <span className="flex items-center gap-2">📥 Export CSV</span>
            </Button>
            <Button onClick={handlePrint}>
              <span className="flex items-center gap-2">🖨️ Print / PDF</span>
            </Button>
          </div>
          {renderReport()}
        </motion.div>
      </div>
    </motion.div>
  );
}
