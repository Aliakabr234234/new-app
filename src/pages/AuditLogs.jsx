import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogsApi } from '../api/analytics.api';
import { Skeleton, Select } from '../components/shared';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => getAuditLogsApi({ page, limit: 20, action: actionFilter || undefined }),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const actionColors = {
    LOGIN: '#10B981', LOGOUT: '#94A3B8', CREATE_USER: '#6366F1', UPDATE_USER: '#F59E0B',
    CHANGE_PASSWORD: '#8B5CF6', RESET_PASSWORD: '#F43F5E', FORGOT_PASSWORD: '#F59E0B',
    CREATE_RESOURCE: '#10B981', UPDATE_RESOURCE: '#F59E0B', DELETE_RESOURCE: '#F43F5E',
    CREATE_PROJECT: '#10B981', UPDATE_PROJECT: '#F59E0B', DELETE_PROJECT: '#F43F5E',
    CREATE_ASSIGNMENT: '#10B981', UPDATE_ASSIGNMENT: '#F59E0B', DELETE_ASSIGNMENT: '#F43F5E',
    RESET_USER_PASSWORD: '#F43F5E',
  };

  return (
    <motion.div className="space-y-6 max-w-6xl" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Audit logs</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {pagination.total} event{pagination.total !== 1 ? 's' : ''} recorded
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item} className="flex gap-3 flex-wrap">
        <Select className="!w-auto" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          {['LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'CREATE_RESOURCE', 'UPDATE_RESOURCE',
            'DELETE_RESOURCE', 'CREATE_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT',
            'CREATE_ASSIGNMENT', 'DELETE_ASSIGNMENT', 'CHANGE_PASSWORD', 'RESET_PASSWORD'].map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ').toLowerCase()}</option>
          ))}
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={stagger.item} className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} height="48px" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'].map(h => (
                    <th key={h} className="text-xs font-medium px-5 py-4" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr key={log.id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    className="transition-colors hover:bg-[rgba(99,102,241,0.03)]"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {log.user?.name || 'System'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: `${actionColors[log.action] || '#94A3B8'}20`, color: actionColors[log.action] || '#94A3B8' }}>
                        {log.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{log.entity}</td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.entityId?.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div variants={stagger.item} className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="btn-press px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}>Previous</button>
          <span className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-press px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}>Next</button>
        </motion.div>
      )}
    </motion.div>
  );
}
