import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Modal, FormField, Input, Select, Button, EmptyState, Tooltip } from '../components/shared';
import InfoBanner from '../components/shared/InfoBanner';

const stagger = { container: { animate: { transition: { staggerChildren: 0.03 } } }, item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } };

const proficiencyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const proficiencyLabels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced', EXPERT: 'Expert' };
const proficiencyColors = { BEGINNER: 'var(--info)', INTERMEDIATE: 'var(--warning)', ADVANCED: 'var(--accent)', EXPERT: 'var(--success)' };

const defaultCategories = ['Design', 'Development', 'Management', 'Marketing', 'Data', 'DevOps'];

function ProficiencyDot({ level }) {
  const idx = proficiencyLevels.indexOf(level);
  const pct = ((idx + 1) / 4) * 100;
  return (
    <Tooltip content={`${proficiencyLabels[level]}`}>
      <div style={{ width: 28, height: 28, position: 'relative' }}>
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border-default)" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="11" fill="none" stroke={proficiencyColors[level]} strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 11 * pct / 100} ${2 * Math.PI * 11}`}
            strokeLinecap="round" transform="rotate(-90 14 14)" />
        </svg>
      </div>
    </Tooltip>
  );
}

function AddSkillModal({ isOpen, onClose }) {
  const { addSkill } = useStore();
  const [form, setForm] = useState({ name: '', category: 'Development' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Skill name is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    addSkill({ name: form.name.trim(), category: form.category });
    setForm({ name: '', category: 'Development' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Skill to Directory">
      <form onSubmit={handleSubmit}>
        <FormField label="Skill Name *" error={errors.name}>
          <Input placeholder="e.g., React, Figma, Python" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Category">
          <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <div className="flex justify-end gap-3" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: '28px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Skill</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SkillsMatrix() {
  const loading = useLoadingState(400);
  const { skills, resources, resourceSkills, addResourceSkill, updateResourceSkill, deleteResourceSkill } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [editingCell, setEditingCell] = useState(null);

  const categories = ['All', ...new Set(skills.map(s => s.category))];
  const filteredSkills = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory);

  const getRS = (resourceId, skillId) => resourceSkills.find(rs => rs.resourceId === resourceId && rs.skillId === skillId);

  const handleCellClick = (resourceId, skillId) => {
    const rs = getRS(resourceId, skillId);
    if (rs) {
      const nextIdx = (proficiencyLevels.indexOf(rs.proficiency) + 1) % (proficiencyLevels.length + 1);
      if (nextIdx === proficiencyLevels.length) deleteResourceSkill(rs.id);
      else updateResourceSkill(rs.id, { proficiency: proficiencyLevels[nextIdx] });
    } else {
      addResourceSkill({ resourceId, skillId, proficiency: 'BEGINNER' });
    }
  };

  if (loading) return <div className="space-y-4"><div className="skeleton h-8 w-48" /><div className="skeleton h-64 w-full" /></div>;

  return (
    <motion.div className="space-y-6 max-w-7xl" variants={stagger.container} initial="initial" animate="animate">
      <InfoBanner id="skills-matrix">
        Map your team's skills and expertise. Click cells to set proficiency levels. Use this data to find the best resource for each project.
      </InfoBanner>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 style={{ marginBottom: '6px' }}>Skills Matrix</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{skills.length} skills · {resources.length} resources</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Skill
          </span>
        </Button>
      </motion.div>

      {/* Category filter */}
      <motion.div variants={stagger.item} className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className="btn-press"
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
              background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border-default)'}`,
              cursor: 'pointer',
            }}>
            {cat}
          </button>
        ))}
      </motion.div>

      {skills.length === 0 ? (
        <EmptyState icon="🎯" title="No skills in your directory yet"
          description="Add your first skill to start building your team's competency profile."
          actionLabel="Add Skill" onAction={() => setModalOpen(true)} />
      ) : (
        <motion.div variants={stagger.item} className="glass-card overflow-x-auto" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semi)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, minWidth: 180 }}>
                  Resource
                </th>
                {filteredSkills.map(skill => (
                  <th key={skill.id} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', minWidth: 60, whiteSpace: 'nowrap' }}>
                    <div>{skill.name}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{skill.category}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr key={resource.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: resource.colorTag }}>
                        {resource.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{resource.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{resource.role}</div>
                      </div>
                    </div>
                  </td>
                  {filteredSkills.map(skill => {
                    const rs = getRS(resource.id, skill.id);
                    return (
                      <td key={skill.id} style={{ padding: '8px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => handleCellClick(resource.id, skill.id)}>
                        <div className="flex items-center justify-center transition-transform hover:scale-110">
                          {rs ? <ProficiencyDot level={rs.proficiency} /> : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px dashed var(--border-default)', opacity: 0.3 }} />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AddSkillModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
