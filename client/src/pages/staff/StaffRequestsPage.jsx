import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { staffRequestsApi } from '../../services/staffService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ReasonDialog from '../../components/common/ReasonDialog';
import { formatDate } from '../../utils/format';
import '../student/StudentPages.css';

export default function StaffRequestsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const act = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setRefreshKey((k) => k + 1); // state may have changed (e.g. already processed), so refresh
    } finally {
      setBusy(false);
      setApproving(null);
      setRejecting(null);
    }
  };

  const columns = [
    { header: 'Student', render: (r) => <span className="book-ref"><strong>{r.student?.fullName}</strong><small>{r.student?.email}</small></span> },
    { header: 'Book', render: (r) => <BookRef book={r.book} /> },
    { header: 'Requested', render: (r) => formatDate(r.createdAt) },
    { header: 'Status', render: (r) => <span><StatusBadge status={r.status} />{r.rejectionReason && <span className="reason">{r.rejectionReason}</span>}</span> },
    {
      header: 'Actions',
      className: 'cell-actions',
      render: (r) => r.status === 'pending' && (
        <span className="row-actions">
          <Button className="small-btn" onClick={() => setApproving(r)}>Approve</Button>
          <Button variant="secondary" className="small-btn" onClick={() => setRejecting(r)}>Reject</Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Borrow Requests" subtitle="Approving a request issues the book and updates inventory." />
      <div className="toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="">All</option>
          <option value="fulfilled">Approved & issued</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <PagedTable load={staffRequestsApi.list} params={{ status: status || undefined }} columns={columns} refreshKey={refreshKey} emptyIcon={ClipboardCheck} emptyTitle="No requests here" emptyMessage={status === 'pending' ? 'There are no pending requests right now.' : 'No requests match this filter.'} />
      <ConfirmDialog open={Boolean(approving)} title="Approve and issue?" message={approving ? `Issue "${approving.book?.title}" to ${approving.student?.fullName}? One copy will be taken from inventory.` : ''} confirmLabel="Approve & issue" loading={busy} onConfirm={() => act(() => staffRequestsApi.approve(approving._id), 'Request approved and book issued.')} onCancel={() => setApproving(null)} />
      <ReasonDialog open={Boolean(rejecting)} title="Reject request" message={rejecting ? `Reject ${rejecting.student?.fullName}'s request for "${rejecting.book?.title}"?` : ''} confirmLabel="Reject request" loading={busy} onConfirm={(reason) => act(() => staffRequestsApi.reject(rejecting._id, reason), 'Request rejected.')} onCancel={() => setRejecting(null)} />
    </>
  );
}
