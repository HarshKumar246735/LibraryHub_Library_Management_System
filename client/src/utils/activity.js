const LABELS = {
  REQUEST_CREATED: 'submitted a borrow request',
  REQUEST_CANCELLED: 'cancelled a borrow request',
  REQUEST_APPROVED: 'approved a borrow request',
  REQUEST_REJECTED: 'rejected a borrow request',
  BOOK_ISSUED: 'issued a book',
  BOOK_RETURNED: 'processed a return',
  RENEWAL_REQUESTED: 'requested a renewal',
  RENEWAL_APPROVED: 'approved a renewal',
  RENEWAL_REJECTED: 'rejected a renewal',
  FINE_PAID: 'recorded a fine payment',
  FINE_WAIVED: 'waived a fine',
  MEMBER_CREATED: 'created a member account',
  MEMBER_UPDATED: 'updated a member',
  MEMBER_ACTIVATED: 'activated an account',
  MEMBER_DEACTIVATED: 'deactivated an account',
  MEMBER_ROLE_CHANGED: 'changed a member role',
};
export const describeActivity = (action) => LABELS[action] || action.toLowerCase().replace(/_/g, ' ');
