import { AlertTriangle, BookCopy, BookOpen, Clock, IndianRupee, Library, UserCog, Users, BookCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '../../services/staffService';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityList from '../../components/dashboard/ActivityList';
import { formatCurrency } from '../../utils/format';
import './AdminDashboard.css';

const PALETTE = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#64748b'];
const STATUS_LABEL = { pending: 'Pending', fulfilled: 'Approved & issued', rejected: 'Rejected', cancelled: 'Cancelled' };
const monthLabel = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.admin(), []);
  const s = data?.summary;
  const c = data?.charts;

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="A live view of the whole library." />
      {loading && <div className="admin-stats">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} height={84} radius={16} />)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="admin-stats">
            <StatCard icon={Library} label="Total books" value={s.totalBooks} />
            <StatCard icon={BookCopy} label="Total copies" value={s.totalCopies} />
            <StatCard icon={BookCheck} label="Available copies" value={s.availableCopies} tone="success" />
            <StatCard icon={Users} label="Registered students" value={s.registeredStudents} />
            <StatCard icon={UserCog} label="Active librarians" value={s.activeLibrarians} />
            <StatCard icon={BookOpen} label="Currently issued" value={s.issuedBooks} />
            <StatCard icon={Clock} label="Pending requests" value={s.pendingRequests} tone="warning" />
            <StatCard icon={AlertTriangle} label="Overdue books" value={s.overdueBooks} tone={s.overdueBooks ? 'danger' : 'success'} />
            <StatCard icon={IndianRupee} label="Outstanding fines" value={formatCurrency(s.outstandingFines)} tone={s.outstandingFines ? 'danger' : 'success'} />
          </div>

          <div className="admin-charts">
            <ChartCard title="Monthly borrowing and returns" isEmpty={c.monthlyActivity.every((m) => !m.issued && !m.returned)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.monthlyActivity.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="issued" name="Issued" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" name="Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Books by category" isEmpty={c.booksByCategory.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={c.booksByCategory} dataKey="count" nameKey="category" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {c.booksByCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Most borrowed books" isEmpty={c.mostBorrowed.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.mostBorrowed} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="title" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Times borrowed" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Request status" isEmpty={c.requestStatus.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={c.requestStatus.map((r) => ({ ...r, name: STATUS_LABEL[r.status] || r.status }))} dataKey="count" nameKey="name" outerRadius={90}>
                    {c.requestStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <section className="panel admin-activity">
            <h2>Recent activity</h2>
            <ActivityList items={data.recentActivity} />
          </section>
        </>
      )}
    </>
  );
}
