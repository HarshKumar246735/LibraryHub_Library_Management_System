import { Link } from 'react-router-dom';
import { AlertTriangle, BookCheck, BookOpen, Clock, Undo2 } from 'lucide-react';
import { dashboardApi } from '../../services/staffService';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import ActivityList from '../../components/dashboard/ActivityList';
import '../admin/AdminDashboard.css';

export default function LibrarianDashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.librarian(), []);
  const s = data?.summary;
  return (
    <>
      <PageHeader
        title="Librarian Dashboard"
        subtitle="Today's desk at a glance."
        actions={<><Link className="btn btn--secondary" to="/staff/requests">Review requests</Link><Link className="btn btn--primary" to="/staff/issues">Issue & return</Link></>}
      />
      {loading && <div className="admin-stats">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={84} radius={16} />)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="admin-stats">
            <StatCard icon={BookCheck} label="Copies available" value={s.availableCopies} tone="success" />
            <StatCard icon={BookOpen} label="Active issues" value={s.activeIssues} />
            <StatCard icon={Clock} label="Pending requests" value={s.pendingRequests} tone="warning" />
            <StatCard icon={AlertTriangle} label="Overdue books" value={s.overdueBooks} tone={s.overdueBooks ? 'danger' : 'success'} />
            <StatCard icon={Undo2} label="Returns processed today" value={s.returnsToday} />
          </div>
          <section className="admin-activity">
            <h2>Recent activity</h2>
            <ActivityList items={data.recentActivity} />
          </section>
        </>
      )}
    </>
  );
}
