import api from './api';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};
