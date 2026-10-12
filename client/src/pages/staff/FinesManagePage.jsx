import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { finesApi } from '../../services/staffService';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import BookRef from '../../components/common/BookRef';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import './FinesManagePage.css';
import '../student/StudentPages.css';

function PaymentModal({ fine, onClose, onDone }) {
  const toast = useToast();
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await finesApi.pay(fine._id, { method, reference: reference.trim() || undefined });
      toast.success('Payment recorded.');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title="Record payment" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="pay-form" loading={busy}>Record payment</Button></>}>
      <form id="pay-form" className="fine-form" onSubmit={submit}>
        <p>{fine.student?.fullName} owes <strong>{formatCurrency(fine.amount)}</strong>. The amount is fixed by the fine record; only the full amount can be recorded.</p>
        <label htmlFor="pay-method">Payment method</label>
        <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
        <label htmlFor="pay-ref">Reference (optional)</label>
        <input id="pay-ref" maxLength={80} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt or transaction number" />
      </form>
    </Modal>
  );
}

function WaiveModal({ fine, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 3) return toast.error('Please give a reason (at least 3 characters).');
    setBusy(true);
    try { await finesApi.waive(fine._id, reason.trim()); toast.success('Fine waived.'); onDone(); } catch (err) { toast.error(getErrorMessage(err)); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open title="Waive fine" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="waive-form" variant="danger" loading={busy}>Waive fine</Button></>}>
      <form id="waive-form" className="fine-form" onSubmit={submit}>
        <p>Waive {formatCurrency(fine.amount)} for {fine.student?.fullName}? This is recorded in the audit log.</p>
        <label htmlFor="waive-reason">Reason</label>
        <textarea id="waive-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </form>
    </Modal>
  );
}

export default function FinesManagePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('pending');
  const [paying, setPaying] = useState(null);
  const [waiving, setWaiving] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const done = () => { setPaying(null); setWaiving(null); setRefreshKey((k) => k + 1); };

  const columns = [
    { header: 'Student', render: (f) => f.student?.fullName },
    { header: 'Book', render: (f) => <BookRef book={f.issue?.book} /> },
    { header: 'Days late', render: (f) => f.daysLate },
    { header: 'Rate/day', render: (f) => formatCurrency(f.ratePerDay) },
    { header: 'Amount', render: (f) => <strong>{formatCurrency(f.amount)}</strong> },
    { header: 'Status', render: (f) => <span><StatusBadge status={f.status} />{f.waiveReason && <span className="reason">{f.waiveReason}</span>}</span> },
    { header: 'Created', render: (f) => formatDate(f.createdAt) },
    { header: 'Actions', className: 'cell-actions', render: (f) => f.status === 'pending' && (
      <span className="row-actions">
        <Button className="small-btn" onClick={() => setPaying(f)}>Record payment</Button>
        {user.role === 'ADMIN' && <Button variant="secondary" className="small-btn" onClick={() => setWaiving(f)}>Waive</Button>}
      </span>
    ) },
  ];

  return (
    <>
      <PageHeader title="Fines" subtitle="Fines are calculated by the server when a late book is returned." />
      <div className="toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>
      <PagedTable load={finesApi.list} params={{ status: status || undefined }} columns={columns} refreshKey={refreshKey} emptyIcon={IndianRupee} emptyTitle="No fines here" emptyMessage="No fines match this filter." />
      {paying && <PaymentModal fine={paying} onClose={() => setPaying(null)} onDone={done} />}
      {waiving && <WaiveModal fine={waiving} onClose={() => setWaiving(null)} onDone={done} />}
    </>
  );
}
