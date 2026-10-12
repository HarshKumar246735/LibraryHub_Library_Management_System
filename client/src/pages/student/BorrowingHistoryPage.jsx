import { History } from 'lucide-react';
import { studentApi } from '../../services/libraryService';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/format';

const PARAMS = { status: 'returned' };
const COLUMNS = [
  { header: 'Book', render: (i) => <BookRef book={i.book} /> },
  { header: 'Issued', render: (i) => formatDate(i.issueDate) },
  { header: 'Due', render: (i) => formatDate(i.dueDate) },
  { header: 'Returned', render: (i) => formatDate(i.returnDate) },
  { header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
];

export default function BorrowingHistoryPage() {
  return (
    <>
      <PageHeader title="Borrowing History" subtitle="Books you have already returned." />
      <PagedTable load={studentApi.myIssues} params={PARAMS} columns={COLUMNS} emptyIcon={History} emptyTitle="No history yet" emptyMessage="Returned books will be listed here." />
    </>
  );
}
