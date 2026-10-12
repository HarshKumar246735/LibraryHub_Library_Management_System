import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, BookMarked, CalendarClock, IndianRupee, Library, ShieldCheck, Search, Send, BookCheck, Undo2 } from 'lucide-react';
import { booksApi, publicApi } from '../../services/bookService';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../../components/books/BookCard';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import './LandingPage.css';

const FEATURES = [
  { icon: Library, title: 'Smart Book Catalogue', text: 'Search by title, author, ISBN or category and filter by availability.' },
  { icon: BookMarked, title: 'Easy Book Borrowing', text: 'Students request books online and librarians approve in a click.' },
  { icon: CalendarClock, title: 'Automated Due Date Tracking', text: 'Due dates, renewals and reminders are tracked for every loan.' },
  { icon: IndianRupee, title: 'Fine Management', text: 'Fines are calculated by the server from your library policy.' },
  { icon: BarChart3, title: 'Library Analytics', text: 'Live dashboards and reports built from your real records.' },
  { icon: ShieldCheck, title: 'Secure Role-Based Access', text: 'Admins, librarians and students only see what they should.' },
];

const STEPS = [
  { icon: Search, title: 'Browse', text: 'Find a book in the catalogue.' },
  { icon: Send, title: 'Request', text: 'Submit a borrowing request.' },
  { icon: BookCheck, title: 'Collect', text: 'A librarian approves and issues it.' },
  { icon: Undo2, title: 'Return', text: 'Return on time to avoid fines.' },
];

const STAT_LABELS = [
  ['totalBooks', 'Book titles'],
  ['totalCopies', 'Copies in the library'],
  ['categories', 'Categories'],
  ['registeredStudents', 'Registered students'],
];

function ShelfIllustration() {
  const spines = [64, 88, 72, 100, 80, 92, 68, 96];
  return (
    <div className="shelf" aria-hidden="true">
      <div className="shelf__books">
        {spines.map((h, i) => <span key={i} className={`shelf__spine shelf__spine--${i % 4}`} style={{ height: `${h}%` }} />)}
      </div>
      <div className="shelf__board" />
    </div>
  );
}

export default function LandingPage() {
  const location = useLocation();
  const featured = useAsync(() => booksApi.list({ limit: 4, sort: 'newest' }), []);
  const stats = useAsync(() => publicApi.stats(), []);

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">Smart Library Management</span>
            <h1>Run your library smarter, and borrow books simpler.</h1>
            <p>LibraryHub brings the catalogue, borrowing, returns and fines into one clean platform for schools, colleges and independent libraries.</p>
            <div className="hero__actions">
              <Link className="btn btn--primary" to="/books">Explore Books</Link>
              <Link className="btn btn--secondary" to="/register">Get Started</Link>
            </div>
          </div>
          <ShelfIllustration />
        </div>
      </section>

      <section id="features" className="section container">
        <h2 className="section__title">Everything your library needs</h2>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature-card">
              <span className="feature-card__icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section__head">
          <h2 className="section__title">Featured books</h2>
          <Link to="/books">View all</Link>
        </div>
        {featured.loading && <div className="book-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={320} radius={16} />)}</div>}
        {featured.error && <EmptyState icon={Library} title="Books are unavailable right now" message="We could not reach the catalogue. Please try again shortly." />}
        {featured.data && featured.data.items.length === 0 && (
          <EmptyState icon={Library} title="No books yet" message="The catalogue is empty. Librarians can add books from their dashboard." />
        )}
        {featured.data && featured.data.items.length > 0 && (
          <div className="book-grid">{featured.data.items.map((b) => <BookCard key={b._id} book={b} />)}</div>
        )}
      </section>

      <section className="section container">
        <h2 className="section__title">How it works</h2>
        <ol className="steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="step">
              <span className="step__num">{i + 1}</span>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="stats">
        <div className="container stats__grid">
          {stats.loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} height={64} />)}
          {stats.data && STAT_LABELS.map(([key, label]) => (
            <div key={key} className="stat"><strong>{stats.data[key]}</strong><span>{label}</span></div>
          ))}
          {stats.error && <p className="stats__error">Live statistics are unavailable right now.</p>}
        </div>
      </section>

      <section id="about" className="section container about">
        <h2 className="section__title">About LibraryHub</h2>
        <p>LibraryHub replaces paper registers and spreadsheets with one connected system. Staff handle approvals, issues and returns quickly, and students always know what is due and what they owe.</p>
      </section>
    </div>
  );
}
