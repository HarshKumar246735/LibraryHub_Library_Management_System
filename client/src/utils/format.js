// Borrowing dates are calendar dates stored at UTC midnight, so they are displayed in UTC.
export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const startOfTodayUtc = () => {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
};
export const isOverdue = (dueDate) => new Date(dueDate).getTime() < startOfTodayUtc();
export const daysUntil = (dueDate) => Math.round((new Date(dueDate).getTime() - startOfTodayUtc()) / 86400000);
