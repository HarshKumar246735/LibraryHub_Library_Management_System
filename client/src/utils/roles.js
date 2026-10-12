export const ROLES = { ADMIN: 'ADMIN', LIBRARIAN: 'LIBRARIAN', STUDENT: 'STUDENT' };
export const homeForRole = (role) =>
  ({ ADMIN: '/admin', LIBRARIAN: '/librarian', STUDENT: '/student' })[role] || '/';
