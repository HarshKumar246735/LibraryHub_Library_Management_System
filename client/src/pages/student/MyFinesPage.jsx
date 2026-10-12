import { IndianRupee } from 'lucide-react';
import { studentApi } from '../../services/libraryService';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import './StudentPages.css';

const COLUMNS = [
  { header: 'Book', render: (f) => <BookRef book={f.issue?.book} /> },
  { header: 'Days late', render: (f) => f.daysLate },
  { header: 'Amount', render: (f) => formatCurrency(f.amount) },
  { header: 'Status', render: (f) => <StatusBadge status={f.status} /> },
  { header: 'Recorded', render: (f) => formatDate(f.createdAt) },
];

export default function MyFinesPage() {
  const summary = useAsync(() => studentApi.dashboard(), []);
  return (
    <>
      <PageHeader title="My Fines" subtitle="Late-return fines are calculated automatically. Pay at the library desk." />
      {summary.data && <div className="summary-strip">Outstanding: {formatCurrency(summary.data.summary.outstandingFines)}</div>}
      <PagedTable load={studentApi.myFines} columns={COLUMNS} emptyIcon={IndianRupee} emptyTitle="No fines" emptyMessage="Return books on time to keep it that way." />
    </>
  );
}
