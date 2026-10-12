import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import './BookCover.css';

// Falls back to a designed placeholder when there is no cover or the remote image fails.
export default function BookCover({ book }) {
  const [failed, setFailed] = useState(false);
  if (!book.coverImageUrl || failed) {
    return (
      <div className="book-cover book-cover--fallback" role="img" aria-label={`No cover available for ${book.title}`}>
        <BookOpen size={28} />
        <span>{book.title}</span>
      </div>
    );
  }
  return <img className="book-cover" src={book.coverImageUrl} alt={`Cover of ${book.title}`} loading="lazy" onError={() => setFailed(true)} />;
}
