import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isToday, differenceInCalendarDays, startOfDay } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Button, StatusBadge, Skeleton } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function ProjectView() {
  const { projects, resources, assignments } = useStore();
  const loading = useLoadingState(600);

  const [zoom, setZoom] = useState(4);
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [expanded, setExpanded] = useState({});
  const [viewMode, setViewMode] = useState('expanded');

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, zoom * 7 - 1),
    });
  }, [startDate, zoom]);

  const today = startOfDay(new Date());
  const todayIndex = days.findIndex(d => isSameDay(d, today));
  const cellWidth = zoom <= 4 ? 44 : zoom <= 8 ? 32 : 24;
  const labelWidth = 200;

  const toggleProject = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isExpanded = (id) => viewMode === 'expanded' ? expanded[id] !== false : expanded[id] === true;

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Project View</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Timeline from the project's perspective</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={stagger.item} className="glass-card flex items-center gap-4 flex-wrap" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Zoom:</span>
          {[{ label: '4W', val: 4 }, { label: '8W', val: 8 }, { label: '12W', val: 12 }].map(z => (
            <button key={z.val}
              className="btn-press transition-all duration-200"
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                background: zoom === z.val ? 'var(--accent)' : 'var(--bg-secondary)',
                color: zoom === z.val ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
              }}
              onClick={() => setZoom(z.val)}>
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

        <div className="flex items-center gap-2">
          <button className="btn-press transition-all duration-200"
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
              background: viewMode === 'collapsed' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: viewMode === 'collapsed' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
            }}
            onClick={() => setViewMode('collapsed')}>
            Collapsed
          </button>
          <button className="btn-press transition-all duration-200"
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
              background: viewMode === 'expanded' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: viewMode === 'expanded' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
            }}
            onClick={() => setViewMode('expanded')}>
            Expanded
          </button>
        </div>

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {format(days[0], 'MMM d')} – {format(days[days.length - 1], 'MMM d, yyyy')}
        </span>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={stagger.item} className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6"><Skeleton height="300px" /></div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No projects to display.</div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${labelWidth + days.length * cellWidth}px` }}>
              {/* Header */}
              <div className="flex sticky top-0 z-10"
                style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)', backdropFilter: 'blur(8px)' }}>
                <div className="shrink-0" style={{ width: `${labelWidth}px`, padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-muted)' }}>Project</span>
                </div>
                <div className="flex relative">
                  {todayIndex >= 0 && (
                    <div className="today-marker" style={{ left: `${todayIndex * cellWidth + cellWidth / 2}px` }} />
                  )}
                  {days.map((day, i) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isTodayDate = isToday(day);
                    return (
                      <div key={i} className="flex flex-col items-center justify-center py-2"
                        style={{
                          width: `${cellWidth}px`,
                          borderRight: '1px solid var(--border-subtle)',
                          background: isTodayDate ? 'var(--accent-subtle)' : isWeekend ? 'rgba(0,0,0,0.08)' : 'transparent',
                        }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{format(day, 'EEE')}</span>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--weight-medium)', color: isTodayDate ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Rows */}
              {projects.map((project, pi) => {
                const projStart = new Date(project.startDate + 'T00:00:00');
                const projEnd = new Date(project.endDate + 'T00:00:00');
                const projAssignments = assignments.filter(a => a.projectId === project.id);
                const isExp = isExpanded(project.id);

                const startIdx = days.findIndex(d => isSameDay(d, projStart) || d >= projStart);
                const endIdx = days.findIndex(d => d >= projEnd);
                const barStart = Math.max(0, startIdx >= 0 ? startIdx : (projStart < days[0] ? 0 : -1));
                const barEnd = endIdx >= 0 ? endIdx : (projEnd > days[days.length - 1] ? days.length - 1 : -1);

                return (
                  <div key={project.id}>
                    {/* Project Row */}
                    <motion.div
                      className="flex cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: pi * 0.05 }}
                      onClick={() => toggleProject(project.id)}>
                      <div className="shrink-0 flex items-center gap-2"
                        style={{ width: `${labelWidth}px`, padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
                        <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                          animate={{ rotate: isExp ? 90 : 0 }}
                          transition={{ duration: 0.2 }}>
                          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: 'var(--text-secondary)' }} />
                        </motion.svg>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: project.colorTag }} />
                        <div className="min-w-0">
                          <div className="truncate" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{project.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {format(projStart, 'MMM d')} – {format(projEnd, 'MMM d')}
                          </div>
                        </div>
                        <div className="ml-auto"><StatusBadge status={project.status} /></div>
                      </div>
                      <div className="flex relative items-center" style={{ height: '52px' }}>
                        {todayIndex >= 0 && (
                          <div className="today-marker" style={{ left: `${todayIndex * cellWidth + cellWidth / 2}px` }} />
                        )}
                        {days.map((day, i) => (
                          <div key={i} style={{
                            width: `${cellWidth}px`, height: '100%',
                            borderRight: '1px solid var(--border-subtle)',
                            background: isToday(day) ? 'var(--accent-subtle)' : (day.getDay() === 0 || day.getDay() === 6) ? 'rgba(0,0,0,0.05)' : 'transparent',
                          }} />
                        ))}
                        {barStart >= 0 && barEnd >= 0 && (
                          <motion.div
                            className="absolute h-7 rounded-lg flex items-center px-2"
                            style={{
                              left: `${barStart * cellWidth + 2}px`,
                              background: project.colorTag,
                              boxShadow: `0 0 12px ${project.colorTag}40`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(barEnd - barStart + 1) * cellWidth - 4}px` }}
                            transition={{ delay: 0.3 + pi * 0.05, duration: 0.6, ease: 'easeOut' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'var(--weight-medium)', color: 'white' }} className="truncate">{project.name}</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Resource Sub-rows */}
                    <AnimatePresence>
                      {isExp && projAssignments.map((asgn, ai) => {
                        const resource = resources.find(r => r.id === asgn.resourceId);
                        if (!resource) return null;
                        const aStart = new Date(asgn.startDate + 'T00:00:00');
                        const aEnd = new Date(asgn.endDate + 'T00:00:00');
                        const aStartIdx = days.findIndex(d => isSameDay(d, aStart) || d >= aStart);
                        const aEndIdx = days.findIndex(d => d >= aEnd);
                        const aBarStart = Math.max(0, aStartIdx >= 0 ? aStartIdx : (aStart < days[0] ? 0 : -1));
                        const aBarEnd = aEndIdx >= 0 ? aEndIdx : (aEnd > days[days.length - 1] ? days.length - 1 : -1);

                        return (
                          <motion.div key={asgn.id}
                            className="flex"
                            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: '44px' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ delay: ai * 0.03 }}>
                            <div className="shrink-0 flex items-center gap-2 pl-8"
                              style={{ width: `${labelWidth}px`, padding: '12px 20px 12px 32px', borderRight: '1px solid var(--border-subtle)' }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                style={{ background: resource.colorTag }}>
                                {resource.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{resource.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{asgn.dailyHours}h/d</span>
                            </div>
                            <div className="flex relative items-center" style={{ height: '44px' }}>
                              {days.map((day, i) => (
                                <div key={i} style={{
                                  width: `${cellWidth}px`, height: '100%',
                                  borderRight: '1px solid var(--border-subtle)',
                                  background: isToday(day) ? 'var(--accent-subtle)' : 'transparent',
                                }} />
                              ))}
                              {aBarStart >= 0 && aBarEnd >= 0 && (
                                <motion.div
                                  className="absolute h-4 rounded-md"
                                  style={{
                                    left: `${aBarStart * cellWidth + 4}px`,
                                    background: resource.colorTag + 'BB',
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(aBarEnd - aBarStart + 1) * cellWidth - 8}px` }}
                                  transition={{ delay: 0.4 + ai * 0.05, duration: 0.5 }} />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
