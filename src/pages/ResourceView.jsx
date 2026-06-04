import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isToday, startOfDay } from 'date-fns';
import useStore from '../store/useStore';
import { useLoadingState } from '../hooks/useAnimations';
import { Button, Skeleton } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

function getUtilColor(pct, colorTag) {
  if (pct > 100) return '#F43F5E';
  if (pct > 80) return colorTag || '#6366F1';
  if (pct > 50) return colorTag ? colorTag + 'CC' : '#6366F1CC';
  if (pct > 0) return colorTag ? colorTag + '66' : '#6366F166';
  return 'transparent';
}

function getUtilBg(pct, colorTag) {
  if (pct > 100) return 'rgba(244, 63, 94, 0.8)';
  if (pct > 80) return colorTag || '#6366F1';
  if (pct > 50) return (colorTag || '#6366F1') + '99';
  if (pct > 0) return (colorTag || '#6366F1') + '4D';
  return 'transparent';
}

function CellTooltip({ resource, day, util }) {
  if (!util || util.isNonWorking) return null;
  return (
    <div className="space-y-1">
      <div style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{resource.name}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{format(day, 'EEEE, MMM d')}</div>
      <div style={{ color: 'var(--text-secondary)' }}>
        {util.hoursAllocated}h / {util.capacityHours}h ({Math.round(util.utilizationPercent)}%)
      </div>
      {util.projectBreakdown && util.projectBreakdown.length > 0 && (
        <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border-default)', marginTop: '4px' }} className="space-y-0.5">
          {util.projectBreakdown.map((pb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pb.projectColor }} />
              <span>{pb.projectName}: {pb.hours}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourceView() {
  const { resources, getResourceUtilizationOnDate, settings } = useStore();
  const loading = useLoadingState(600);
  const scrollRef = useRef(null);

  const [zoom, setZoom] = useState(4);
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showHours, setShowHours] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [filterResources, setFilterResources] = useState([]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, zoom * 7 - 1),
    });
  }, [startDate, zoom]);

  const filteredResources = filterResources.length > 0
    ? resources.filter(r => filterResources.includes(r.id))
    : resources;

  const today = startOfDay(new Date());
  const todayIndex = days.findIndex(d => isSameDay(d, today));
  const cellWidth = zoom <= 4 ? 44 : zoom <= 8 ? 32 : 24;

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>Resource View</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Gantt-style resource utilization timeline</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={stagger.item} className="glass-card flex items-center gap-4 flex-wrap" style={{ padding: '16px 20px' }}>
        {/* Zoom */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Zoom:</span>
          {[{ label: '4W', val: 4 }, { label: '8W', val: 8 }, { label: '12W', val: 12 }].map(z => (
            <button key={z.val}
              className="btn-press transition-all duration-200"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                background: zoom === z.val ? 'var(--accent)' : 'var(--bg-secondary)',
                color: zoom === z.val ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setZoom(z.val)}>
              {z.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
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

        {/* Show Hours Toggle */}
        <button
          className="btn-press transition-all duration-200"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            background: showHours ? 'var(--accent)' : 'var(--bg-secondary)',
            color: showHours ? '#FFFFFF' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setShowHours(!showHours)}>
          {showHours ? 'Hide Hours' : 'Show Hours'}
        </button>

        {/* Date range display */}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {format(days[0], 'MMM d')} – {format(days[days.length - 1], 'MMM d, yyyy')}
        </span>
      </motion.div>

      {/* Timeline Grid */}
      <motion.div variants={stagger.item} className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6"><Skeleton height="300px" /></div>
        ) : filteredResources.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No resources to display.</div>
        ) : (
          <div className="overflow-x-auto" ref={scrollRef}>
            <div style={{ minWidth: `${180 + days.length * cellWidth}px` }}>
              {/* Header */}
              <div className="flex sticky top-0 z-10"
                style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)', backdropFilter: 'blur(8px)' }}>
                <div className="shrink-0" style={{ width: '180px', padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-muted)' }}>Resource</span>
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

              {/* Rows */}
              {filteredResources.map((resource, ri) => (
                <motion.div key={resource.id}
                  className="flex transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ri * 0.04 }}>
                  <div className="shrink-0 flex items-center gap-2"
                    style={{ width: '180px', padding: '16px 20px', borderRight: '1px solid var(--border-subtle)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: resource.colorTag }}>
                      {resource.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{resource.name}</div>
                      <div className="truncate" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{resource.role}</div>
                    </div>
                  </div>
                  <div className="flex relative">
                    {todayIndex >= 0 && (
                      <div className="today-marker" style={{ left: `${todayIndex * cellWidth + cellWidth / 2}px` }} />
                    )}
                    {days.map((day, di) => {
                      const util = getResourceUtilizationOnDate(resource.id, day);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const cellKey = `${resource.id}-${di}`;
                      const isHovered = hoveredCell === cellKey;
                      const bg = util.isNonWorking ? 'transparent' : getUtilBg(util.utilizationPercent, resource.colorTag);

                      return (
                        <div key={di} className="relative flex items-center justify-center cursor-pointer"
                          style={{
                            width: `${cellWidth}px`,
                            height: '52px',
                            borderRight: '1px solid var(--border-subtle)',
                            background: isWeekend ? 'rgba(0,0,0,0.08)' : 'transparent',
                          }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}>
                          {!util.isNonWorking && util.hoursAllocated > 0 && (
                            <motion.div
                              className="absolute inset-1 rounded-md overflow-hidden flex items-center justify-center"
                              style={{ 
                                background: util.utilizationPercent > 100 ? 'var(--danger)' : bg,
                                backgroundImage: util.utilizationPercent > 100 ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 4px, transparent 4px, transparent 8px)' : 'none'
                              }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: ri * 0.02 + di * 0.005 }}
                            >
                              {util.utilizationPercent > 100 && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-bl-sm flex items-center justify-center" style={{ padding: '1px' }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                  </svg>
                                </div>
                              )}
                              {showHours && (
                                <span className="relative z-10" style={{ fontSize: '9px', fontWeight: 'var(--weight-bold)', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                                  {util.hoursAllocated}h
                                </span>
                              )}
                            </motion.div>
                          )}
                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && !util.isNonWorking && (
                              <motion.div
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                transition={{ duration: 0.15 }}>
                                <div className="shadow-xl whitespace-nowrap"
                                  style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '8px 12px',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-primary)',
                                  }}>
                                  <CellTooltip resource={resource} day={day} util={util} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <motion.div variants={stagger.item} className="flex items-center gap-6" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(99,102,241,0.3)' }} />
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(99,102,241,0.6)' }} />
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: '#6366F1' }} />
          <span>80-100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: '#F43F5E' }} />
          <span>&gt;100%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
