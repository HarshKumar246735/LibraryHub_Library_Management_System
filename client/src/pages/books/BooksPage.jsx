import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Search, BookX } from 'lucide-react';
import { booksApi } from '../../services/bookService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import BookCard from '../../components/books/BookCard';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import './BooksPage.css';

const PAGE_SIZE = 12;
const SORTS = [
  ['newest', 'Newest first'],
  ['title', 'Title A–Z'],
  ['-title', 'Title Z–A'],
  ['-year', 'Year: newest'],
  ['year', 'Year: oldest'],
];

export default function BooksPage() {
  const [params, setParams] = useSearchParams();
  const [layout, setLayout] = useState('grid');
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounce(search);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const availability = params.get('availability') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  // Update one or more URL params; any filter change returns to page 1.
  const update = (changes, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debounced !== q) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const categories = useAsync(() => booksApi.categories(), []);
  const books = useAsync(
    () => booksApi.list({ q: q || undefined, category: category || undefined, availability: availability || undefined, sort, page, limit: PAGE_SIZE }),
    [q, category, availability, sort, page]
  );

  const hasFilters = Boolean(q || category || availability);
  const clear = () => { setSearch(''); setParams({}, { replace: true }); };

  return (
    <div className="container books-page">
      <header className="books-page__header">
        <h1>Explore Books</h1>
        <p>Browse the catalogue and find your next read.</p>
      </header>

      <div className="books-toolbar">
        <label className="books-toolbar__search">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search title, author, ISBN or category" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search books" />
        </label>
        <select aria-label="Category" value={category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          {(categories.data || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Availability" value={availability} onChange={(e) => update({ availability: e.target.value })}>
          <option value="">Any availability</option>
          <option value="available">Available now</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="books-toolbar__view" role="group" aria-label="Layout">
          <button type="button" className={layout === 'grid' ? 'is-active' : ''} aria-pressed={layout === 'grid'} aria-label="Grid view" onClick={() => setLayout('grid')}><LayoutGrid size={18} /></button>
          <button type="button" className={layout === 'list' ? 'is-active' : ''} aria-pressed={layout === 'list'} aria-label="List view" onClick={() => setLayout('list')}><List size={18} /></button>
        </div>
      </div>

      {books.loading && (
        <div className={`books-results books-results--${layout}`}>
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height={layout === 'grid' ? 340 : 140} radius={16} />)}
        </div>
      )}
      {books.error && <ErrorState error={books.error} onRetry={books.reload} />}
      {books.data && books.data.items.length === 0 && (
        <EmptyState
          icon={BookX}
          title={hasFilters ? 'No books match your search' : 'The catalogue is empty'}
          message={hasFilters ? 'Try different keywords or clear the filters.' : 'No books have been added yet.'}
          action={hasFilters && <Button variant="secondary" onClick={clear}>Clear filters</Button>}
        />
      )}
      {books.data && books.data.items.length > 0 && (
        <>
          <p className="books-page__count" aria-live="polite">{books.data.pagination.total} book{books.data.pagination.total === 1 ? '' : 's'} found</p>
          <div className={`books-results books-results--${layout}`}>
            {books.data.items.map((b) => <BookCard key={b._id} book={b} layout={layout} />)}
          </div>
          <Pagination page={books.data.pagination.page} totalPages={books.data.pagination.totalPages} onChange={(p) => { update({ page: String(p) }, true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}
    </div>
  );
}
