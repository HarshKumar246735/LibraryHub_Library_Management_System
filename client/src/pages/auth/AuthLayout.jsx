import Logo from '../../components/common/Logo';
import './AuthPages.css';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <aside className="auth-page__brand">
        <Logo light />
        <h2>Your Library, Smarter and Simpler.</h2>
        <p>Browse the catalogue, request books, and track due dates in one place.</p>
      </aside>
      <section className="auth-page__panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
          <div className="auth-card__footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
