import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { booksApi, requestsApi } from '../../services/bookService';
import { getErrorMessage } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import BookCover from '../../components/books/BookCover';
import AvailabilityBadge from '../../components/books/AvailabilityBadge';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './BookDetailsPage.css';

function RequestAction({ book }) {
  const { user } = useAuth();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!user) return <Link className="btn btn--primary" to="/login" state={{ from: { pathname: `/books/${book._id}` } }}>Log in to request this book</Link>;
  if (user.role !== 'STUDENT') return <p className="details__note"><Info size={16} /> Staff accounts manage books from the dashboard.</p>;

  const unavailable = book.availableCopies < 1;
  const submit = async () => {
    setSubmitting(true);
    try {
      await requestsApi.create(book._id);
      setRequested(true);
      toast.success('Request submitted. You will be notified when it is reviewed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <Button onClick={() => setConfirming(true)} disabled={unavailable || requested}>{requested ? 'Request submitted' : 'Request this book'}</Button>
      {unavailable && <p className="details__note"><Info size={16} /> All copies are currently on loan, so requests are closed for now.</p>}
      <ConfirmDialog open={confirming} title="Request this book?" message={`A librarian will review your request for "${book.title}".`} confirmLabel="Submit request" loading={submitting} onConfirm={submit} onCancel={() => setConfirming(false)} />
    </>
  );
}

export default function BookDetailsPage() {
  const { id } = useParams();
  const { data: book, loading, error, reload } = useAsync(() => booksApi.get(id), [id]);

  return (
    <div className="container details">
      <Link to="/books" className="details__back"><ArrowLeft size={16} /> Back to catalogue</Link>
      {loading && <div className="details__grid"><Skeleton height={420} radius={16} /><div className="details__skeleton"><Skeleton height={32} /><Skeleton height={20} width="50%" /><Skeleton height={120} /></div></div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {book && (
        <div className="details__grid">
          <div className="details__cover"><BookCover book={book} /></div>
          <div className="details__info">
            <Badge tone="info">{book.category}</Badge>
            <h1>{book.title}</h1>
            <p className="details__author">by {book.author}</p>
            <AvailabilityBadge book={book} />
            {book.description && <p className="details__desc">{book.description}</p>}
            <dl className="details__meta">
              {book.isbn && <><dt>ISBN</dt><dd>{book.isbn}</dd></>}
              {book.publisher && <><dt>Publisher</dt><dd>{book.publisher}</dd></>}
              {book.publicationYear && <><dt>Year</dt><dd>{book.publicationYear}</dd></>}
              {book.language && <><dt>Language</dt><dd>{book.language}</dd></>}
              {book.shelfLocation && <><dt>Shelf</dt><dd>{book.shelfLocation}</dd></>}
              <dt>Copies</dt><dd>{book.availableCopies} of {book.totalCopies} available</dd>
            </dl>
            <div className="details__action"><RequestAction book={book} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
