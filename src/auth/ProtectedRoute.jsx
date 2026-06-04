import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { motion } from 'framer-motion';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <motion.svg
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <path d="M10 2A8 8 0 1 0 18 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </motion.svg>
          </div>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
