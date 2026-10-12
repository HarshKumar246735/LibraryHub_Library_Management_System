import api from './api';

const unwrapList = (r) => ({ items: r.data.data, pagination: r.data.pagination });

export const booksApi = {
  list: (params) => api.get('/books', { params }).then(unwrapList),
  get: (id) => api.get(`/books/${id}`).then((r) => r.data.data),
  categories: () => api.get('/books/categories').then((r) => r.data.data),
  create: (payload) => api.post('/books', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/books/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/books/${id}`).then((r) => r.data),
};

export const publicApi = {
  stats: () => api.get('/public/stats').then((r) => r.data.data),
};

export const requestsApi = {
  create: (bookId) => api.post('/requests', { bookId }).then((r) => r.data.data),
};
