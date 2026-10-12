import { useState } from 'react';
import { BookCopy, Plus, Search } from 'lucide-react';
import { booksApi } from '../../services/bookService';
import { getErrorMessage } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import PagedTable from '../../components/common/PagedTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BookFormModal from '../../components/books/BookFormModal';
import BookRef from '../../components/common/BookRef';
import '../student/StudentPages.css';

export default function ManageBooksPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const [formBook, setFormBook] = useState(undefined); // undefined = closed, null = new, object = editing
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const remove = async () => {
    setBusy(true);
    try {
      const res = await booksApi.remove(deleting._id);
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setDeleting(null);
      refresh();
    }
  };

  const columns = [
    { header: 'Book', render: (b) => <BookRef book={b} /> },
    { header: 'Category', render: (b) => <Badge tone="info">{b.category}</Badge> },
    { header: 'ISBN', render: (b) => b.isbn || '—' },
    { header: 'Copies', render: (b) => `${b.availableCopies} / ${b.totalCopies} available` },
    { header: 'Shelf', render: (b) => b.shelfLocation || '—' },
    { header: 'Actions', className: 'cell-actions', render: (b) => (
      <span className="row-actions">
        <Button variant="secondary" className="small-btn" onClick={() => setFormBook(b)}>Edit</Button>
        <Button variant="secondary" className="small-btn" onClick={() => setDeleting(b)}>Remove</Button>
      </span>
    ) },
  ];

  return (
    <>
      <PageHeader title="Manage Books" subtitle="Add, edit and remove catalogue entries." actions={<Button onClick={() => setFormBook(null)}><Plus size={16} /> Add book</Button>} />
      <div className="toolbar">
        <label className="search-box"><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search title, author, ISBN or category" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search books" /></label>
      </div>
      <PagedTable load={booksApi.list} params={{ q: q || undefined, sort: 'title' }} columns={columns} refreshKey={refreshKey} emptyIcon={BookCopy} emptyTitle="No books found" emptyMessage="Add your first book to build the catalogue." />
      <BookFormModal open={formBook !== undefined} book={formBook || undefined} onClose={() => setFormBook(undefined)} onSaved={() => { setFormBook(undefined); refresh(); }} />
      <ConfirmDialog open={Boolean(deleting)} title="Remove this book?" message={deleting ? `"${deleting.title}" will be removed from the catalogue. Books with borrowing history are archived so records stay intact; books on loan cannot be removed.` : ''} confirmLabel="Remove book" danger loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
