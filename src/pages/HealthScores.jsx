import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { EmptyState } from '../components/shared';
import ProgressRing from '../components/shared/ProgressRing';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

const scoreLabel = (s) => s >= 85 ? '🟢 Healthy' : s >= 70 ? '🟡 Watch' : s >= 50 ? '🟠 At Risk' : '🔴 Critical';
const scoreColor = (s) => s >= 85 ? 'var(--success)' : s >= 70 ? 'var(--warning)' : s >= 50 ? '#F97316' : 'var(--danger)';

function FactorBar({ label, value, max = 20 }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
      </div>
    </div>
  );
}

function TrendSparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120, h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HealthScores() {
  const navigate = useNavigate();
  const { resources, getHealthScore, getTeamHealthScore } = useStore();
  const teamHealth = getTeamHealthScore();

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="health-scores">
        A single number (0–100) per resource tells you if they're healthy or at risk of burnout. Based on utilization, stability, leave, and more.
      </InfoBanner>

      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px' }}>Team Workload Health</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{resources.length} resources tracked</p>
      </motion.div>

      {/* Team overview */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <div className="flex items-center gap-6">
          <ProgressRing value={teamHealth.average} size={80} strokeWidth={6}>
            <span style={{ fontSize: '22px', fontWeight: 'var(--weight-bold)', color: scoreColor(teamHealth.average) }}>{teamHealth.average}</span>
          </ProgressRing>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Team Score: {teamHealth.average}/100
            </div>
            <div style={{ fontSize: 'var(--text-base)', color: scoreColor(teamHealth.average) }}>{scoreLabel(teamHealth.average)}</div>
            {teamHealth.atRisk.length > 0 && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', marginTop: '8px' }}>
                ⚠ {teamHealth.atRisk.length} resource{teamHealth.atRisk.length !== 1 ? 's' : ''} at risk
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Per-resource cards */}
      {resources.length === 0 ? (
        <EmptyState icon="💚" title="No resources to score" description="Add resources to see their workload health scores." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>
          {teamHealth.scores.sort((a, b) => a.overall - b.overall).map((score) => (
            <motion.div key={score.resource.id} className="glass-card cursor-pointer"
              style={{ padding: '24px 28px' }} variants={stagger.item} whileHover={{ y: -2 }}
              onClick={() => navigate(`/resources/${score.resource.id}`)}>
              <div className="flex items-start gap-4">
                <ProgressRing value={score.overall} size={56} strokeWidth={4} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{score.resource.name}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: scoreColor(score.overall) }}>{scoreLabel(score.overall)}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '12px' }}>{score.resource.role}</div>

                  <FactorBar label="Utilization Balance" value={Math.round(score.factors.utilizationBalance)} />
                  <FactorBar label="Schedule Stability" value={Math.round(score.factors.scheduleStability)} />
                  <FactorBar label="Burnout Risk" value={Math.round(score.factors.burnoutRisk)} />
                  <FactorBar label="Leave Balance" value={Math.round(score.factors.leaveBalance)} />
                  <FactorBar label="Actual Alignment" value={Math.round(score.factors.actualAlignment)} />

                  {score.weeklyUtils && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>8-week trend</span>
                      <TrendSparkline data={score.weeklyUtils} />
                    </div>
                  )}

                  {score.recommendation && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', fontSize: 'var(--text-sm)', color: 'var(--warning-text)' }}>
                      💡 {score.recommendation}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
