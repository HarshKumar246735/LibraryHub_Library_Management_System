import Badge from './Badge';

const MAP = {
  pending: ['warning', 'Pending'],
  approved: ['success', 'Approved'],
  fulfilled: ['success', 'Approved & issued'],
  rejected: ['danger', 'Rejected'],
  cancelled: ['neutral', 'Cancelled'],
  issued: ['info', 'Issued'],
  returned: ['success', 'Returned'],
  lost: ['danger', 'Lost'],
  overdue: ['danger', 'Overdue'],
  paid: ['success', 'Paid'],
  waived: ['neutral', 'Waived'],
  active: ['success', 'Active'],
  inactive: ['neutral', 'Inactive'],
};

export default function StatusBadge({ status }) {
  const [tone, label] = MAP[status] || ['neutral', status];
  return <Badge tone={tone}>{label}</Badge>;
}
