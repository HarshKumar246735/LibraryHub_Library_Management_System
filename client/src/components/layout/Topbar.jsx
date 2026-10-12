import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import './Topbar.css';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onLogout = async () => {
    await logout();
    toast.success('You have been logged out.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" aria-label="Open menu" onClick={onMenu}><Menu size={22} /></button>
      <div className="topbar__spacer" />
      <NotificationBell />
      <div className="topbar__user">
        <span className="topbar__avatar" aria-hidden="true">{user.fullName.charAt(0).toUpperCase()}</span>
        <span className="topbar__name">{user.fullName}</span>
      </div>
      <Button variant="secondary" onClick={onLogout} aria-label="Log out"><LogOut size={16} /> <span className="topbar__logout-text">Log out</span></Button>
    </header>
  );
}
