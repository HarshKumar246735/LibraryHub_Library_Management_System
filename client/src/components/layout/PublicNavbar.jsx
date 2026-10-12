import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../utils/roles';
import './PublicNavbar.css';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/books', label: 'Explore Books' },
  { to: '/#features', label: 'Features', hash: true },
  { to: '/#about', label: 'About', hash: true },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const close = () => setOpen(false);

  return (
    <header className="public-nav">
      <div className="container public-nav__inner">
        <Logo />
        <button type="button" className="public-nav__toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`public-nav__menu ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map((l) =>
            l.hash ? (
              <Link key={l.to} to={l.to} onClick={close}>{l.label}</Link>
            ) : (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={close}>{l.label}</NavLink>
            )
          )}
          <div className="public-nav__actions">
            {user ? (
              <Link className="btn btn--primary" to={homeForRole(user.role)} onClick={close}>Go to dashboard</Link>
            ) : (
              <>
                <Link className="btn btn--secondary" to="/login" onClick={close}>Login</Link>
                <Link className="btn btn--primary" to="/register" onClick={close}>Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
