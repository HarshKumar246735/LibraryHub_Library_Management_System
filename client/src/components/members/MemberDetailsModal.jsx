import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatusBadge from '../common/StatusBadge';
import Skeleton from '../common/Skeleton';
import ErrorState from '../common/ErrorState';
import { membersApi } from '../../services/staffService';
import { getErrorMessage } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { formatCurrency, formatDate } from '../../utils/format';
import './MemberModals.css';

export default function MemberDetailsModal({ memberId, onClose, onChanged }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data: m, loading, error, reload } = useAsync(() => (memberId ? membersApi.get(memberId) : Promise.resolve(null)), [memberId]);
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);
  const isAdmin = me.role === 'ADMIN';
  const isSelf = m && m._id === me._id;

  const run = async (fn, message) => {
    setBusy(true);
    try { await fn(); toast.success(message); await reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Modal open={Boolean(memberId)} title="Member details" onClose={onClose}>
      {loading && <div className="member-skeleton"><Skeleton height={24} /><Skeleton height={80} /></div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {m && (
        <>
          <h3 className="member-name">{m.fullName} <StatusBadge status={m.status} /></h3>
          <dl className="member-meta">
            <dt>Email</dt><dd>{m.email}</dd>
            <dt>Role</dt><dd><Badge tone="info">{m.role.toLowerCase()}</Badge></dd>
            {m.studentId && <><dt>Student ID</dt><dd>{m.studentId}</dd></>}
            {m.phone && <><dt>Phone</dt><dd>{m.phone}</dd></>}
            <dt>Joined</dt><dd>{formatDate(m.createdAt)}</dd>
            {m.role === 'STUDENT' && <><dt>Books on loan</dt><dd>{m.activeLoans}</dd><dt>Outstanding fines</dt><dd>{formatCurrency(m.outstandingFines)}</dd></>}
          </dl>
          {isAdmin && !isSelf && (
            <div className="member-actions">
              <Button variant={m.status === 'active' ? 'danger' : 'primary'} loading={busy} onClick={() => run(() => membersApi.setStatus(m._id, m.status === 'active' ? 'inactive' : 'active'), m.status === 'active' ? 'Account deactivated.' : 'Account activated.')}>
                {m.status === 'active' ? 'Deactivate account' : 'Activate account'}
              </Button>
              <div className="member-role">
                <select aria-label="New role" value={role || m.role} onChange={(e) => setRole(e.target.value)} className="member-select">
                  <option value="STUDENT">Student</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <Button variant="secondary" loading={busy} disabled={!role || role === m.role} onClick={() => run(() => membersApi.setRole(m._id, role), 'Role updated.')}>Update role</Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
