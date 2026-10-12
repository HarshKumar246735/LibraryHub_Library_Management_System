import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { membersApi } from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import MemberFormModal from '../../components/members/MemberFormModal';
import MemberDetailsModal from '../../components/members/MemberDetailsModal';
import { formatDate } from '../../utils/format';
import '../student/StudentPages.css';

export default function MembersPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const columns = [
    { header: 'Member', render: (m) => <span className="book-ref"><strong>{m.fullName}</strong><small>{m.email}</small></span> },
    { header: 'Role', render: (m) => <Badge tone="info">{m.role.toLowerCase()}</Badge> },
    { header: 'Student ID', render: (m) => m.studentId || '—' },
    { header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { header: 'Joined', render: (m) => formatDate(m.createdAt) },
    { header: 'Actions', className: 'cell-actions', render: (m) => <Button variant="secondary" className="small-btn" onClick={() => setSelectedId(m._id)}>View</Button> },
  ];

  return (
    <>
      <PageHeader title="Members" subtitle={isAdmin ? 'Manage students, librarians and administrators.' : 'Look up student accounts.'} actions={isAdmin && <Button onClick={() => setCreating(true)}><Plus size={16} /> Add member</Button>} />
      <div className="toolbar">
        <label className="search-box"><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search name, email or student ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search members" /></label>
        {isAdmin && (
          <select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="LIBRARIAN">Librarians</option>
            <option value="ADMIN">Administrators</option>
          </select>
        )}
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <PagedTable load={membersApi.list} params={{ q: q || undefined, role: role || undefined, status: status || undefined }} columns={columns} refreshKey={refreshKey} emptyIcon={Users} emptyTitle="No members found" emptyMessage="Try a different search or filter." />
      <MemberDetailsModal memberId={selectedId} onClose={() => setSelectedId(null)} onChanged={refresh} />
      <MemberFormModal open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refresh(); }} />
    </>
  );
}
