import { useState } from 'react';
import { Send } from 'lucide-react';
import { studentApi } from '../../services/libraryService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/format';
import './StudentPages.css';

export default function MyRequestsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const cancel = async () => {
    setBusy(true);
    try {
      await studentApi.cancelRequest(target._id);
      toast.success('Request cancelled.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const columns = [
    { header: 'Book', render: (r) => <BookRef book={r.book} /> },
    { header: 'Requested', render: (r) => formatDate(r.createdAt) },
    { header: 'Status', render: (r) => <span><StatusBadge status={r.status} />{r.rejectionReason && <span className="reason">{r.rejectionReason}</span>}</span> },
    { header: 'Action', className: 'cell-actions', render: (r) => r.status === 'pending' ? <Button variant="secondary" className="small-btn" onClick={() => setTarget(r)}>Cancel</Button> : null },
  ];

  return (
    <>
      <PageHeader title="My Requests" subtitle="Track the borrowing requests you have submitted." />
      <div className="toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="fulfilled">Approved & issued</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <PagedTable load={studentApi.myRequests} params={{ status: status || undefined }} columns={columns} refreshKey={refreshKey} emptyIcon={Send} emptyTitle="No requests yet" emptyMessage="Open a book in the catalogue and choose Request this book." />
      <ConfirmDialog open={Boolean(target)} title="Cancel this request?" message={target ? `Your request for "${target.book?.title}" will be withdrawn.` : ''} confirmLabel="Cancel request" danger loading={busy} onConfirm={cancel} onCancel={() => setTarget(null)} />
    </>
  );
}
