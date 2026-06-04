import api from './axios.instance';

export async function listUsersApi() {
  const { data } = await api.get('/users');
  return data;
}

export async function getUserApi(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

export async function createUserApi(userData) {
  const { data } = await api.post('/users', userData);
  return data;
}

export async function updateUserApi(id, updates) {
  const { data } = await api.put(`/users/${id}`, updates);
  return data;
}

export async function resetUserPasswordApi(id) {
  const { data } = await api.post(`/users/${id}/reset-password`);
  return data;
}
