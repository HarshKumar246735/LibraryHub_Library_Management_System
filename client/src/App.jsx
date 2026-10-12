import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/public/LandingPage';
import BooksPage from './pages/books/BooksPage';
import BookDetailsPage from './pages/books/BookDetailsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MyBooksPage from './pages/student/MyBooksPage';
import MyRequestsPage from './pages/student/MyRequestsPage';
import BorrowingHistoryPage from './pages/student/BorrowingHistoryPage';
import MyFinesPage from './pages/student/MyFinesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import StaffRequestsPage from './pages/staff/StaffRequestsPage';
import StaffRenewalsPage from './pages/staff/StaffRenewalsPage';
import IssueReturnPage from './pages/staff/IssueReturnPage';
import ManageBooksPage from './pages/staff/ManageBooksPage';
import MembersPage from './pages/staff/MembersPage';
import FinesManagePage from './pages/staff/FinesManagePage';
import ReportsPage from './pages/staff/ReportsPage';
import ProfilePage from './pages/shared/ProfilePage';
import NotificationsPage from './pages/shared/NotificationsPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute roles={['STUDENT']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/books" element={<MyBooksPage />} />
        <Route path="/student/requests" element={<MyRequestsPage />} />
        <Route path="/student/history" element={<BorrowingHistoryPage />} />
        <Route path="/student/fines" element={<MyFinesPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute roles={['LIBRARIAN']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/librarian" element={<LibrarianDashboard />} />
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/staff/requests" element={<StaffRequestsPage />} />
        <Route path="/staff/renewals" element={<StaffRenewalsPage />} />
        <Route path="/staff/issues" element={<IssueReturnPage />} />
        <Route path="/staff/books" element={<ManageBooksPage />} />
        <Route path="/staff/members" element={<MembersPage />} />
        <Route path="/staff/fines" element={<FinesManagePage />} />
        <Route path="/staff/reports" element={<ReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
