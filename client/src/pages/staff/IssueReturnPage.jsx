import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { booksApi } from '../../services/bookService';
import { membersApi, staffIssuesApi } from '../../services/staffService';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import LookupSelect from '../../components/common/LookupSelect';
import BookRef from '../../components/common/BookRef';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, isOverdue } from '../../utils/format';
import './IssueReturnPage.css';
import '../student/StudentPages.css';

const VIEWS = {
  active: { label: 'Active loans', params: { status: 'issued' } },
  overdue: { label: 'Overdue', params: { overdue: 'true' } },
  returned: { label: 'Returned', params: { status: 'returned' } },
};

const searchStudents = (q) => membersApi.list({ q, role: 'STUDENT', status: 'active', limit: 5 }).then((r) => r.items);
const searchBooks = (q) => booksApi.list({ q, availability: 'available', limit: 5 }).then((r) => r.items);

export default function IssueReturnPage() {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [book, setBook] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [view, setView] = useState('active');
  const [returning, setReturning] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const issue = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try {
      await staffIssuesApi.issue(student._id, book._id);
      toast.success(`Issued "${book.title}" to ${student.fullName}.`);
      setStudent(null);
      setBook(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIssuing(false);
      setRefreshKey((k) => k + 1);
    }
  };

  const processReturn = async () => {
    setBusy(true);
    try {
      const { fine } = await staffIssuesApi.returnBook(returning._id);
      toast.success(fine ? `Returned. Late fine recorded: ${formatCurrency(fine.amount)}.` : 'Book returned.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setReturning(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const columns = [
    { header: 'Student', render: (i) => <span className="book-ref"><strong>{i.student?.fullName}</strong><small>{i.student?.studentId || i.student?.email}</small></span> },
    { header: 'Book', render: (i) => <BookRef book={i.book} /> },
    { header: 'Issued', render: (i) => formatDate(i.issueDate) },
    { header: 'Due', render: (i) => <>{formatDate(i.dueDate)} {i.status === 'issued' && isOverdue(i.dueDate) && <StatusBadge status="overdue" />}</> },
    { header: 'Returned', render: (i) => formatDate(i.returnDate) },
    { header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    { header: 'Action', className: 'cell-actions', render: (i) => i.status === 'issued' && <Button className="small-btn" onClick={() => setReturning(i)}>Process return</Button> },
  ];

  return (
    <>
      <PageHeader title="Issue & Return" subtitle="Issue books at the desk and process returns." />
      <form className="issue-form" onSubmit={issue}>
        <h2>Issue a book</h2>
        <div className="issue-form__grid">
          <LookupSelect id="issue-student" label="Student" placeholder="Search by name, email or student ID" search={searchStudents} getLabel={(s) => s.fullName} getHint={(s) => s.studentId || s.email} value={student} onChange={setStudent} />
          <LookupSelect id="issue-book" label="Book (available only)" placeholder="Search by title, author or ISBN" search={searchBooks} getLabel={(b) => b.title} getHint={(b) => `${b.author} · ${b.availableCopies} available`} value={book} onChange={setBook} />
          <Button type="submit" loading={issuing} disabled={!student || !book}>Issue book</Button>
        </div>
      </form>

      <div className="toolbar" role="tablist" aria-label="Loan view">
        {Object.entries(VIEWS).map(([key, v]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} className={`tab ${view === key ? 'is-active' : ''}`} onClick={() => setView(key)}>{v.label}</button>
        ))}
      </div>
      <PagedTable load={staffIssuesApi.list} params={VIEWS[view].params} columns={columns} refreshKey={refreshKey} emptyIcon={ArrowLeftRight} emptyTitle="No loans here" emptyMessage="Nothing matches this view right now." />
      <ConfirmDialog open={Boolean(returning)} title="Process return?" message={returning ? `Mark "${returning.book?.title}" as returned by ${returning.student?.fullName}. A late fine is added automatically if it is overdue.` : ''} confirmLabel="Process return" loading={busy} onConfirm={processReturn} onCancel={() => setReturning(null)} />
    </>
  );
}
