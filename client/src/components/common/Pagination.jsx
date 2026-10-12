import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

function pageWindow(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      {pages.map((p, i) => (
        <span key={p} className="pagination__item">
          {i > 0 && p - pages[i - 1] > 1 && <span className="pagination__gap">…</span>}
          <button type="button" className={p === page ? 'is-active' : ''} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>{p}</button>
        </span>
      ))}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
    </nav>
  );
}
