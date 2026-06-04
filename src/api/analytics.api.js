import api from './axios.instance';

export async function getDashboardApi() {
  const { data } = await api.get('/analytics/dashboard');
  return data;
}

export async function getUtilizationApi(params = {}) {
  const { data } = await api.get('/analytics/utilization', { params });
  return data;
}

export async function getCompanyTimelineApi(params = {}) {
  const { data } = await api.get('/analytics/company-timeline', { params });
  return data;
}

export async function getAuditLogsApi(params = {}) {
  const { data } = await api.get('/analytics/audit-logs', { params });
  return data;
}
