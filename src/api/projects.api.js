import api from './axios.instance';

export async function listProjectsApi() {
  const { data } = await api.get('/projects');
  return data;
}

export async function getProjectApi(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function createProjectApi(project) {
  const { data } = await api.post('/projects', project);
  return data;
}

export async function updateProjectApi(id, updates) {
  const { data } = await api.put(`/projects/${id}`, updates);
  return data;
}

export async function deleteProjectApi(id) {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}
