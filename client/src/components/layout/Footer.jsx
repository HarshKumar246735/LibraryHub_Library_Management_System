import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from '../common/Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Logo light />
          <p className="site-footer__tagline">Your Library, Smarter and Simpler.</p>
        </div>
        <nav aria-label="Footer">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/books">Explore Books</Link>
          <Link to="/#features">Features</Link>
          <Link to="/login">Login</Link>
        </nav>
        <address>
          <h4>Contact</h4>
          <p><Mail size={14} /> library@example.com</p>
          <p><Phone size={14} /> +91 00000 00000</p>
          <p><MapPin size={14} /> Your library address here</p>
        </address>
      </div>
      <div className="container site-footer__copy">© {new Date().getFullYear()} LibraryHub. All rights reserved.</div>
    </footer>
  );
}
