import { Activity } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { describeActivity } from '../../utils/activity';
import { formatDateTime } from '../../utils/format';
import './ActivityList.css';

export default function ActivityList({ items }) {
  if (!items.length) return <EmptyState icon={Activity} title="No activity yet" message="Library actions will be listed here as they happen." />;
  return (
    <ul className="activity">
      {items.map((a) => (
        <li key={a._id}>
          <span className="activity__dot" aria-hidden="true" />
          <span><strong>{a.actor?.fullName || 'System'}</strong> {describeActivity(a.action)}</span>
          <time dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
        </li>
      ))}
    </ul>
  );
}
