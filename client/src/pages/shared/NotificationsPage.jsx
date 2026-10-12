import { useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../../services/libraryService';
import { getErrorMessage } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/common/Skeleton';
import { formatDateTime } from '../../utils/format';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => notificationsApi.list({ page, limit: 15 }), [page]);

  const run = async (fn) => {
    try { await fn(); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates about your requests, loans and fines." actions={data?.unreadCount > 0 && <Button variant="secondary" onClick={() => run(notificationsApi.readAll)}>Mark all as read</Button>} />
      {loading && !data && <div className="notif-list">{[0, 1, 2].map((i) => <Skeleton key={i} height={72} radius={12} />)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon={Bell} title="No notifications" message="You will see request updates and due-date reminders here." />}
      {data && data.items.length > 0 && (
        <>
          <ul className="notif-list">
            {data.items.map((n) => (
              <li key={n._id} className={`notif ${n.isRead ? '' : 'notif--unread'}`}>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <small>{formatDateTime(n.createdAt)}</small>
                </div>
                {!n.isRead && <Button variant="secondary" className="small-btn" onClick={() => run(() => notificationsApi.read(n._id))}>Mark read</Button>}
              </li>
            ))}
          </ul>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
