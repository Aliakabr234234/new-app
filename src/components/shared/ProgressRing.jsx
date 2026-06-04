import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressRing({ value, size = 48, strokeWidth = 4, color, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (value >= 85) return 'var(--success)';
    if (value >= 70) return 'var(--warning)';
    if (value >= 50) return '#F97316';
    return 'var(--danger)';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--bg-secondary)" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor()} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span style={{ fontSize: size < 40 ? '10px' : '12px', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
            {Math.round(value)}
          </span>
        )}
      </div>
    </div>
  );
}
