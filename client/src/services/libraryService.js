import api from './api';

const list = (url) => (params) => api.get(url, { params }).then((r) => ({ items: r.data.data, pagination: r.data.pagination }));
const data = (r) => r.data.data;

export const studentApi = {
  dashboard: () => api.get('/dashboard/student').then(data),
  myRequests: list('/requests/my'),
  cancelRequest: (id) => api.patch(`/requests/${id}/cancel`).then(data),
  myIssues: list('/issues/my'),
  myFines: list('/fines/my'),
  myRenewals: list('/renewals/my'),
  requestRenewal: (issueId) => api.post('/renewals', { issueId }).then(data),
};

export const profileApi = {
  update: (payload) => api.patch('/auth/profile', payload).then(data),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => ({ items: r.data.data, pagination: r.data.pagination, unreadCount: r.data.unreadCount })),
  read: (id) => api.patch(`/notifications/${id}/read`).then(data),
  readAll: () => api.patch('/notifications/read-all'),
};
