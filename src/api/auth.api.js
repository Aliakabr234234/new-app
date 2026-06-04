import api, { setAccessToken } from './axios.instance';

export async function loginApi(email, password, rememberMe = false) {
  const { data } = await api.post('/auth/login', { email, password, rememberMe });
  setAccessToken(data.accessToken);
  return data;
}

export async function logoutApi() {
  await api.post('/auth/logout');
}

export async function refreshTokenApi() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.accessToken);
  return data;
}

export async function getMeApi() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function changePasswordApi(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function forgotPasswordApi(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPasswordApi(token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data;
}
