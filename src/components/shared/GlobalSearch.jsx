import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { projects, resources, skills } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items = [];

    // Search Projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        items.push({ id: p.id, title: p.name, subtitle: 'Project', type: 'project', path: `/projects/${p.id}`, icon: '📁', color: p.colorTag });
      }
    });

    // Search Resources
    resources.forEach(r => {
      if (r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)) {
        items.push({ id: r.id, title: r.name, subtitle: `Resource • ${r.role}`, type: 'resource', path: `/resources/${r.id}`, icon: '👤', color: r.colorTag });
      }
    });

    // Search Skills
    skills.forEach(s => {
      if (s.name.toLowerCase().includes(q)) {
        items.push({ id: s.id, title: s.name, subtitle: 'Skill', type: 'skill', path: `/skills`, icon: '🎯', color: '#8B5CF6' });
      }
    });

    return items.slice(0, 10); // Max 10 results
  }, [query, projects, resources, skills]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleAction = (item) => {
    setIsOpen(false);
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAction(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Search Box */}
          <motion.div
            className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-default)]"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="flex items-center px-4 py-4 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-lg"
                placeholder="Search resources, projects, or skills..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <span className="text-[var(--text-muted)] text-xs border border-[var(--border-subtle)] rounded px-1.5 py-0.5 ml-3">ESC</span>
            </div>

            {query && results.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                No results found for "{query}"
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {results.map((item, i) => (
                  <div
                    key={item.id + item.type}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                      i === selectedIndex ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-elevated)]'
                    }`}
                    onClick={() => handleAction(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.color + '20', color: item.color }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--text-primary)] font-medium truncate">{item.title}</div>
                      <div className="text-[var(--text-secondary)] text-sm">{item.subtitle}</div>
                    </div>
                    {i === selectedIndex && (
                      <span className="text-[var(--text-muted)] text-xs">Press Enter</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!query && (
              <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] text-[var(--text-muted)] text-xs flex justify-between">
                <div className="flex gap-4">
                  <span><kbd className="font-sans border border-[var(--border-default)] rounded px-1 pb-0.5 mr-1">↑↓</kbd> to navigate</span>
                  <span><kbd className="font-sans border border-[var(--border-default)] rounded px-1 pb-0.5 mr-1">Enter</kbd> to select</span>
                </div>
                <div>Search across the entire workspace</div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
