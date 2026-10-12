import axios from 'axios';

// Single configured client; the base URL comes from the environment, never hardcoded in pages.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the HttpOnly auth cookie
  headers: { 'X-Requested-With': 'LibraryHub' },
});

export const getErrorMessage = (error) =>
  error?.response?.data?.message || (error?.request ? 'Cannot reach the server. Please try again.' : 'Something went wrong.');

export const getFieldErrors = (error) =>
  Object.fromEntries((error?.response?.data?.errors || []).filter((e) => e.field).map((e) => [e.field, e.message]));

export default api;
