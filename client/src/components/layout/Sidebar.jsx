import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { NAV_BY_ROLE } from '../../utils/navigation';
import { homeForRole } from '../../utils/roles';
import './Sidebar.css';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = NAV_BY_ROLE[user.role] || [];
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Sidebar">
        <div className="sidebar__brand">
          <Logo light to={homeForRole(user.role)} />
          <button type="button" className="sidebar__close" aria-label="Close menu" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="sidebar__nav">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className="sidebar__link">
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="sidebar__role">{user.role.toLowerCase()} account</p>
      </aside>
    </>
  );
}
