import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { studentApi } from '../../services/libraryService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, isOverdue } from '../../utils/format';
import './StudentPages.css';

const PARAMS = { status: 'issued' };

export default function MyBooksPage() {
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const renew = async () => {
    setBusy(true);
    try {
      await studentApi.requestRenewal(target._id);
      toast.success('Renewal requested. A librarian will review it.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const columns = [
    { header: 'Book', render: (i) => <BookRef book={i.book} /> },
    { header: 'Issued', render: (i) => formatDate(i.issueDate) },
    { header: 'Due', render: (i) => <>{formatDate(i.dueDate)} {isOverdue(i.dueDate) && <StatusBadge status="overdue" />}</> },
    { header: 'Renewals used', render: (i) => i.renewalCount },
    { header: 'Action', className: 'cell-actions', render: (i) => <Button variant="secondary" className="small-btn" onClick={() => setTarget(i)} disabled={isOverdue(i.dueDate)}>Request renewal</Button> },
  ];

  return (
    <>
      <PageHeader title="My Books" subtitle="Books you currently have on loan." />
      <PagedTable load={studentApi.myIssues} params={PARAMS} columns={columns} refreshKey={refreshKey} emptyIcon={BookOpen} emptyTitle="No books on loan" emptyMessage="Books you borrow will appear here with their due dates." />
      <ConfirmDialog open={Boolean(target)} title="Request a renewal?" message={target ? `Ask to extend the loan for "${target.book?.title}". Overdue books cannot be renewed.` : ''} confirmLabel="Request renewal" loading={busy} onConfirm={renew} onCancel={() => setTarget(null)} />
    </>
  );
}
