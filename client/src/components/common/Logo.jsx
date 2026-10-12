import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import './Logo.css';

export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo--light' : ''}`} aria-label="LibraryHub home">
      <span className="logo__mark"><BookOpen size={20} /></span>
      <span className="logo__text">Library<strong>Hub</strong></span>
    </Link>
  );
}
