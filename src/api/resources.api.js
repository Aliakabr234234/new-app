import api from './axios.instance';

export async function listResourcesApi() {
  const { data } = await api.get('/resources');
  return data;
}

export async function createResourceApi(resource) {
  const { data } = await api.post('/resources', resource);
  return data;
}

export async function updateResourceApi(id, updates) {
  const { data } = await api.put(`/resources/${id}`, updates);
  return data;
}

export async function deleteResourceApi(id) {
  const { data } = await api.delete(`/resources/${id}`);
  return data;
}
