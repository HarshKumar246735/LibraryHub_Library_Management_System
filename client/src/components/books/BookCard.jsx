import { Link } from 'react-router-dom';
import BookCover from './BookCover';
import AvailabilityBadge from './AvailabilityBadge';
import Badge from '../common/Badge';
import './BookCard.css';

export default function BookCard({ book, layout = 'grid' }) {
  return (
    <article className={`book-card book-card--${layout}`}>
      <Link to={`/books/${book._id}`} className="book-card__cover" aria-label={`View ${book.title}`} tabIndex={-1}>
        <BookCover book={book} />
      </Link>
      <div className="book-card__body">
        <Badge tone="info">{book.category}</Badge>
        <h3 className="book-card__title"><Link to={`/books/${book._id}`}>{book.title}</Link></h3>
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__footer">
          <AvailabilityBadge book={book} />
          <Link className="book-card__link" to={`/books/${book._id}`}>View Details</Link>
        </div>
      </div>
    </article>
  );
}
