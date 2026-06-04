import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Button, Input, FormField, Modal } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const accentColors = [
  { label: 'Indigo', color: '#6366F1' },
  { label: 'Blue', color: '#3B82F6' },
  { label: 'Purple', color: '#8B5CF6' },
  { label: 'Emerald', color: '#10B981' },
  { label: 'Rose', color: '#F43F5E' },
  { label: 'Amber', color: '#F59E0B' },
  { label: 'Teal', color: '#14B8A6' },
  { label: 'Pink', color: '#EC4899' },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Settings() {
  const { settings, updateSettings, exportData, clearAllData } = useStore();
  const [showClearModal, setShowClearModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resourceflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleWorkingDay = (day) => {
    const days = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day].sort();
    updateSettings({ workingDays: days });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div className="space-y-6 max-w-3xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Manage your workspace preferences</p>
      </motion.div>

      {/* Appearance (Theme) */}
      <motion.div variants={stagger.item} className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Appearance</h2>
        <div className="flex gap-4 flex-wrap" style={{ marginTop: '16px' }}>
          {/* Dark Mode Card */}
          <button onClick={() => updateSettings({ theme: 'dark' })}
            className="relative flex flex-col items-center justify-center transition-all duration-300"
            style={{
              width: '160px', height: '120px',
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${settings.theme === 'dark' || !settings.theme ? 'var(--accent)' : 'var(--border-default)'}`,
              padding: '12px',
              cursor: 'pointer',
              background: '#0F1221',
              transform: settings.theme === 'dark' || !settings.theme ? 'scale(1.04)' : 'scale(1)',
              boxShadow: settings.theme === 'dark' || !settings.theme ? '0 0 0 4px var(--accent-glow)' : 'none',
              overflow: 'hidden',
            }}>
            {(settings.theme === 'dark' || !settings.theme) && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute flex items-center justify-center shadow-lg pointer-events-none"
                style={{
                  top: '8px', right: '8px', width: '20px', height: '20px',
                  borderRadius: '50%', background: 'var(--accent)',
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </motion.div>
            )}
            <div className="w-full flex-1 flex gap-2 mb-3 pointer-events-none" style={{ height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', borderRadius: '4px', background: '#1A1F35' }}></div>
              <div className="flex-1 flex flex-col gap-3" style={{ padding: '6px' }}>
                <div style={{ height: '6px', background: '#2A2F4A', borderRadius: '3px' }}></div>
                <div style={{ height: '6px', background: '#6366F1', borderRadius: '3px', width: '60%' }}></div>
              </div>
            </div>
            <span className="pointer-events-none" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: '#EEF2FF' }}>Dark</span>
          </button>

          {/* Light Mode Card */}
          <button onClick={() => updateSettings({ theme: 'light' })}
            className="relative flex flex-col items-center justify-center transition-all duration-300"
            style={{
              width: '160px', height: '120px',
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${settings.theme === 'light' ? 'var(--accent)' : 'var(--border-default)'}`,
              padding: '12px',
              cursor: 'pointer',
              background: '#F5F7FC',
              transform: settings.theme === 'light' ? 'scale(1.04)' : 'scale(1)',
              boxShadow: settings.theme === 'light' ? '0 0 0 4px var(--accent-glow)' : 'none',
              overflow: 'hidden',
            }}>
            {settings.theme === 'light' && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute flex items-center justify-center shadow-lg pointer-events-none"
                style={{
                  top: '8px', right: '8px', width: '20px', height: '20px',
                  borderRadius: '50%', background: 'var(--accent)',
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </motion.div>
            )}
            <div className="w-full flex-1 flex gap-2 mb-3 pointer-events-none" style={{ height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}></div>
              <div className="flex-1 flex flex-col gap-3" style={{ padding: '6px' }}>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px' }}></div>
                <div style={{ height: '6px', background: '#4F46E5', borderRadius: '3px', width: '60%' }}></div>
              </div>
            </div>
            <span className="pointer-events-none" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semi)', color: '#0D1117' }}>Light</span>
          </button>
        </div>
      </motion.div>

      {/* App Name */}
      <motion.div variants={stagger.item} className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>General</h2>
        <FormField label="App Name">
          <Input value={settings.appName}
            onChange={(e) => updateSettings({ appName: e.target.value })} />
        </FormField>
        <FormField label="Working Hours Per Day">
          <Input type="number" min="1" max="24" value={settings.workingHoursPerDay}
            onChange={(e) => updateSettings({ workingHoursPerDay: Number(e.target.value) })} />
        </FormField>
      </motion.div>

      {/* Working Days */}
      <motion.div variants={stagger.item} className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Working Days</h2>
        <div className="flex gap-2 flex-wrap">
          {dayNames.map((name, i) => (
            <button key={i} onClick={() => toggleWorkingDay(i)}
              className="btn-press transition-all duration-200"
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                border: `1px solid ${settings.workingDays.includes(i) ? 'var(--accent)' : 'var(--border-default)'}`,
                background: settings.workingDays.includes(i) ? 'var(--accent)' : 'var(--bg-input)',
                color: settings.workingDays.includes(i) ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}>
              {name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Accent Color */}
      <motion.div variants={stagger.item} className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Accent Color</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {accentColors.map(({ label, color }) => (
            <button key={color} onClick={() => updateSettings({ accentColor: color })}
              className="flex flex-col items-center gap-2 group" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div className="w-10 h-10 transition-all duration-200"
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: color,
                  border: `2px solid ${settings.accentColor === color ? 'var(--text-primary)' : 'transparent'}`,
                  transform: settings.accentColor === color ? 'scale(1.1)' : 'scale(1)',
                }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={stagger.item} className="glass-card space-y-4" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)' }}>Data Management</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={handleExport}>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Export as JSON
            </span>
          </Button>
          <Button variant="danger" onClick={() => setShowClearModal(true)}>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14M6 4V2H10V4M6 7V12M10 7V12M3 4V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clear All Data
            </span>
          </Button>
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={stagger.item} className="glass-card" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semi)', color: 'var(--text-primary)', marginBottom: '8px' }}>About</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {settings.appName} — Project Management & Resource Utilization App
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
          Data is stored locally in your browser. No backend required.
        </p>
      </motion.div>

      {/* Clear Confirmation Modal */}
      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear All Data" maxWidth="400px">
        <div className="space-y-4">
          <div className="flex items-start gap-3" style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
          }}>
            <span className="text-xl">⚠️</span>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>This action cannot be undone</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                All resources, projects, and assignments will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '28px' }}>
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { clearAllData(); setShowClearModal(false); }}>
              Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
