import { useState } from 'react';
import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCsv, reportsApi } from '../../services/staffService';
import { getErrorMessage } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import ChartCard from '../../components/dashboard/ChartCard';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { BookCheck, BookOpen, IndianRupee, Wallet } from 'lucide-react';
import './ReportsPage.css';

const isoDay = (d) => d.toISOString().slice(0, 10);
const defaultRange = () => {
  const now = new Date();
  return { from: isoDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))), to: isoDay(now) };
};
const monthLabel = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
// The "to" date is inclusive, so send the end of that day.
const toParams = ({ from, to }) => ({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` });

function SimpleTable({ headers, rows, empty }) {
  if (!rows.length) return <p className="report-empty">{empty}</p>;
  return (
    <div className="table-scroll">
      <table className="report-table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const toast = useToast();
  const [range, setRange] = useState(defaultRange);
  const [exporting, setExporting] = useState('');
  const valid = range.from && range.to && range.from <= range.to;
  const params = toParams(range);

  const borrowing = useAsync(() => (valid ? reportsApi.borrowing(params) : Promise.resolve(null)), [range.from, range.to]);
  const fines = useAsync(() => (valid ? reportsApi.fines(params) : Promise.resolve(null)), [range.from, range.to]);
  const inventory = useAsync(() => reportsApi.inventory(), []);

  const exportCsv = async (report) => {
    setExporting(report);
    try { await downloadCsv(report, params, `${report}-report.csv`); } catch (err) { toast.error(getErrorMessage(err)); } finally { setExporting(''); }
  };
  const onRange = (e) => setRange((r) => ({ ...r, [e.target.name]: e.target.value }));
  const b = borrowing.data;
  const f = fines.data;
  const inv = inventory.data;

  return (
    <>
      <PageHeader title="Reports" subtitle="All figures are calculated from live records." actions={<><Button variant="secondary" loading={exporting === 'borrowing'} onClick={() => exportCsv('borrowing')} disabled={!valid}><Download size={16} /> Borrowing CSV</Button><Button variant="secondary" loading={exporting === 'fines'} onClick={() => exportCsv('fines')} disabled={!valid}><Download size={16} /> Fines CSV</Button></>} />
      <div className="report-range">
        <label>From <input type="date" name="from" value={range.from} max={range.to} onChange={onRange} /></label>
        <label>To <input type="date" name="to" value={range.to} min={range.from} onChange={onRange} /></label>
        {!valid && <span className="report-range__error" role="alert">Choose a valid date range.</span>}
      </div>

      {(borrowing.error || fines.error) && <ErrorState error={borrowing.error || fines.error} onRetry={() => { borrowing.reload(); fines.reload(); }} />}
      {(borrowing.loading || fines.loading) && !b && <div className="report-stats">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} radius={16} />)}</div>}

      {b && f && (
        <>
          <div className="report-stats">
            <StatCard icon={BookOpen} label="Books issued" value={b.totals.issued} />
            <StatCard icon={BookCheck} label="Books returned" value={b.totals.returned} tone="success" />
            <StatCard icon={Wallet} label="Fines collected" value={formatCurrency(f.collected.total)} tone="success" />
            <StatCard icon={IndianRupee} label="Outstanding fines" value={formatCurrency(f.outstanding.total)} tone={f.outstanding.total ? 'danger' : 'success'} />
          </div>

          <div className="report-charts">
            <ChartCard title="Monthly issue and return trend" isEmpty={b.monthlyActivity.every((m) => !m.issued && !m.returned)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={b.monthlyActivity.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="issued" name="Issued" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" name="Returned" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Student registrations" isEmpty={b.registrationTrend.every((m) => !m.registrations)}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={b.registrationTrend.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip />
                  <Line type="monotone" dataKey="registrations" name="New students" stroke="#4f46e5" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="report-tables">
            <section className="panel"><h2>Most borrowed books</h2>
              <SimpleTable headers={['Book', 'Author', 'Times']} empty="No borrowing in this period." rows={b.mostBorrowedBooks.map((x) => [x.title, x.author, x.count])} />
            </section>
            <section className="panel"><h2>Most active students</h2>
              <SimpleTable headers={['Student', 'Email', 'Loans']} empty="No borrowing in this period." rows={b.mostActiveStudents.map((x) => [x.fullName, x.email, x.count])} />
            </section>
            <section className="panel"><h2>Fine collection records</h2>
              <SimpleTable headers={['Date', 'Student', 'Amount', 'Method', 'Recorded by']} empty="No payments recorded in this period." rows={f.payments.map((p) => [formatDateTime(p.createdAt), p.student?.fullName, formatCurrency(p.amount), p.method, p.recordedBy?.fullName])} />
            </section>
          </div>
        </>
      )}

      <section className="panel report-inventory">
        <h2>Inventory</h2>
        {inventory.loading && !inv && <Skeleton height={120} />}
        {inventory.error && <ErrorState error={inventory.error} onRetry={inventory.reload} />}
        {inv && (
          <>
            <p className="report-summary">{inv.totals.titles} titles · {inv.totals.totalCopies} copies · {inv.totals.availableCopies} available · {inv.totals.currentlyIssued} issued · {inv.totals.overdue} overdue</p>
            <SimpleTable headers={['Category', 'Titles', 'Copies', 'Available']} empty="No books in the catalogue yet." rows={inv.byCategory.map((c) => [c.category, c.titles, c.totalCopies, c.availableCopies])} />
            {inv.outOfStock.length > 0 && <p className="report-summary">Out of stock: {inv.outOfStock.map((x) => x.title).join(', ')}</p>}
          </>
        )}
      </section>
    </>
  );
}
