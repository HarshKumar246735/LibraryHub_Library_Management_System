import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

export default function PublicLayout() {
  return (
    <>
      <PublicNavbar />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
