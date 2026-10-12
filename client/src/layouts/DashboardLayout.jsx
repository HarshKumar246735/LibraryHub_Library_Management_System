import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="shell__main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="shell__content"><Outlet /></main>
      </div>
    </div>
  );
}
