import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Button, EmptyState, Modal, FormField, Input } from '../components/shared';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

export default function Scenarios() {
  const { scenarios, activeScenarioId, createScenario, enterScenario, exitScenario, deleteScenario, publishScenario } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState('');
  const [confirmPublish, setConfirmPublish] = useState(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    createScenario(name, '');
    setName('');
    setNewOpen(false);
  };

  const handlePublish = (id) => {
    publishScenario(id);
    setConfirmPublish(null);
  };

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="scenarios">
        Create sandboxed copies of your plan. Make changes freely, compare with the live plan, and publish only when you're satisfied.
      </InfoBanner>

      {activeScenarioId && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #F59E0B20, #F59E0B10)',
            border: '1px solid var(--warning)',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
          <span style={{ fontSize: '18px' }}>🔬</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--warning-text)', flex: 1 }}>
            Scenario Mode: "{scenarios.find(s => s.id === activeScenarioId)?.name}" — Changes don't affect live plan
          </span>
          <Button onClick={() => setConfirmPublish(activeScenarioId)} style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--success)', borderColor: 'var(--success)' }}>Publish ✓</Button>
          <Button variant="secondary" onClick={exitScenario} style={{ padding: '6px 14px', fontSize: '12px' }}>Exit ✗</Button>
        </motion.div>
      )}

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Scenario Planning</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Scenario
          </span>
        </Button>
      </motion.div>

      {scenarios.length === 0 ? (
        <EmptyState icon="🔬" title="No scenarios yet"
          description="Create a scenario to safely experiment with plan changes before committing."
          actionLabel="New Scenario" onAction={() => setNewOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {scenarios.map((s) => (
            <motion.div key={s.id} className="glass-card" style={{ padding: '24px 28px' }} variants={stagger.item} whileHover={{ y: -4 }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Created {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semi)',
                  background: s.isPublished ? 'var(--success-bg)' : 'var(--warning-bg)',
                  color: s.isPublished ? 'var(--success-text)' : 'var(--warning-text)',
                }}>{s.isPublished ? 'Published' : 'Draft'}</span>
              </div>
              <div className="flex gap-2 mt-4">
                {!s.isPublished && (
                  <>
                    <Button onClick={() => enterScenario(s.id)} className="flex-1" style={{ fontSize: '12px', padding: '7px 12px' }}>Open</Button>
                    <Button onClick={() => setConfirmPublish(s.id)} style={{ fontSize: '12px', padding: '7px 12px', background: 'var(--success)', borderColor: 'var(--success)' }}>Publish</Button>
                  </>
                )}
                <Button variant="danger" onClick={() => deleteScenario(s.id)} style={{ padding: '7px 12px', fontSize: '12px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M5 4V2H9V4M3 4V12C3 12.5523 3.44772 13 4 13H10C10.5523 13 11 12.5523 11 12V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Scenario Modal */}
      <Modal isOpen={newOpen} onClose={() => setNewOpen(false)} title="New Scenario">
        <FormField label="Scenario Name *">
          <Input placeholder="e.g., Q3 Replan" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        </FormField>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '20px' }}>
          This will create a sandboxed copy of your current plan. Changes won't affect the live plan until you publish.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Scenario</Button>
        </div>
      </Modal>

      {/* Publish confirm */}
      <Modal isOpen={!!confirmPublish} onClose={() => setConfirmPublish(null)} title="Publish Scenario?">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          This will replace your live plan with this scenario's assignments. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmPublish(null)}>Cancel</Button>
          <Button onClick={() => handlePublish(confirmPublish)} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>Confirm Publish</Button>
        </div>
      </Modal>
    </motion.div>
  );
}
