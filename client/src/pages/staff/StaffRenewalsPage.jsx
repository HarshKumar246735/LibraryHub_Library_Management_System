import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { staffRenewalsApi } from '../../services/staffService';
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

export default function StaffRenewalsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const act = async (fn, message) => {
    setBusy(true);
    try { await fn(); toast.success(message); } catch (err) { toast.error(getErrorMessage(err)); } finally {
      setRefreshKey((k) => k + 1);
      setBusy(false);
      setApproving(null);
      setRejecting(null);
    }
  };

  const columns = [
    { header: 'Student', render: (r) => r.student?.fullName },
    { header: 'Book', render: (r) => <BookRef book={r.issue?.book} /> },
    { header: 'Current due', render: (r) => formatDate(r.newDueDate || r.issue?.dueDate) },
    { header: 'Renewals used', render: (r) => r.issue?.renewalCount ?? 0 },
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
      <PageHeader title="Renewal Requests" subtitle="Approved renewals extend the due date by the standard borrowing period." />
      <div className="toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <PagedTable load={staffRenewalsApi.list} params={{ status: status || undefined }} columns={columns} refreshKey={refreshKey} emptyIcon={RefreshCw} emptyTitle="No renewal requests" emptyMessage="Renewal requests from students will appear here." />
      <ConfirmDialog open={Boolean(approving)} title="Approve renewal?" message={approving ? `Extend ${approving.student?.fullName}'s loan of "${approving.issue?.book?.title}"?` : ''} confirmLabel="Approve renewal" loading={busy} onConfirm={() => act(() => staffRenewalsApi.approve(approving._id), 'Renewal approved.')} onCancel={() => setApproving(null)} />
      <ReasonDialog open={Boolean(rejecting)} title="Reject renewal" message={rejecting ? `Reject the renewal for "${rejecting.issue?.book?.title}"?` : ''} confirmLabel="Reject renewal" loading={busy} onConfirm={(reason) => act(() => staffRenewalsApi.reject(rejecting._id, reason), 'Renewal rejected.')} onCancel={() => setRejecting(null)} />
    </>
  );
}
