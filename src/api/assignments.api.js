import api from './axios.instance';

export async function listAssignmentsApi(params = {}) {
  const { data } = await api.get('/assignments', { params });
  return data;
}

export async function createAssignmentApi(assignment) {
  const { data } = await api.post('/assignments', assignment);
  return data;
}

export async function updateAssignmentApi(id, updates) {
  const { data } = await api.put(`/assignments/${id}`, updates);
  return data;
}

export async function deleteAssignmentApi(id) {
  const { data } = await api.delete(`/assignments/${id}`);
  return data;
}
