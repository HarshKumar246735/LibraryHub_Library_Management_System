import { Link } from 'react-router-dom';
import './BookRef.css';

// Compact "title / author" cell that links to the public book page.
export default function BookRef({ book }) {
  if (!book) return <span>Removed book</span>;
  return (
    <span className="book-ref">
      <Link to={`/books/${book._id}`}>{book.title}</Link>
      <small>{book.author}</small>
    </span>
  );
}
