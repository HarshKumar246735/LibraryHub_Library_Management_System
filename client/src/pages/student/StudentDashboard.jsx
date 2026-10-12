import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, IndianRupee, Send } from 'lucide-react';
import { studentApi } from '../../services/libraryService';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/common/Skeleton';
import BookRef from '../../components/common/BookRef';
import { daysUntil, formatCurrency, formatDate, isOverdue } from '../../utils/format';
import './StudentPages.css';

function DueLabel({ dueDate }) {
  if (isOverdue(dueDate)) return <StatusBadge status="overdue" />;
  const d = daysUntil(dueDate);
  return <span className="muted">{d === 0 ? 'Due today' : `${d} day${d === 1 ? '' : 's'} left`}</span>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => studentApi.dashboard(), []);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.fullName.split(' ')[0]}`}
        subtitle="Here is what is happening with your library account."
        actions={<Link className="btn btn--primary" to="/books">Explore Books</Link>}
      />
      {loading && <div className="stat-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} radius={16} />)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="stat-grid">
            <StatCard icon={BookOpen} label="Currently borrowed" value={data.summary.currentlyBorrowed} />
            <StatCard icon={Send} label="Pending requests" value={data.summary.pendingRequests} tone="warning" />
            <StatCard icon={AlertTriangle} label="Overdue books" value={data.summary.overdueBooks} tone={data.summary.overdueBooks ? 'danger' : 'success'} />
            <StatCard icon={IndianRupee} label="Outstanding fines" value={formatCurrency(data.summary.outstandingFines)} tone={data.summary.outstandingFines ? 'danger' : 'success'} />
          </div>

          <div className="two-col">
            <section className="panel">
              <h2>Upcoming due dates</h2>
              {data.upcomingDue.length === 0 ? (
                <EmptyState icon={BookOpen} title="Nothing due" message="Books you borrow will show their due dates here." />
              ) : (
                <ul className="mini-list">
                  {data.upcomingDue.map((i) => (
                    <li key={i._id}><BookRef book={i.book} /><span className="mini-list__meta">{formatDate(i.dueDate)}<DueLabel dueDate={i.dueDate} /></span></li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel">
              <h2>Recently borrowed</h2>
              {data.recentlyBorrowed.length === 0 ? (
                <EmptyState icon={BookOpen} title="No borrowing yet" message="Request a book from the catalogue to get started." />
              ) : (
                <ul className="mini-list">
                  {data.recentlyBorrowed.map((i) => (
                    <li key={i._id}><BookRef book={i.book} /><span className="mini-list__meta">{formatDate(i.issueDate)}<StatusBadge status={i.status} /></span></li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
