import { ArrowLeftRight, BarChart3, BookCopy, BookOpen, Bell, ClipboardCheck, Gauge, History, IndianRupee, Library, RefreshCw, Send, User, Users } from 'lucide-react';

const common = [
  { to: '/books', label: 'Explore Books', icon: Library },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My Profile', icon: User },
];

const staffCore = [
  { to: '/staff/requests', label: 'Borrow Requests', icon: ClipboardCheck },
  { to: '/staff/renewals', label: 'Renewals', icon: RefreshCw },
  { to: '/staff/issues', label: 'Issue & Return', icon: ArrowLeftRight },
  { to: '/staff/books', label: 'Manage Books', icon: BookCopy },
  { to: '/staff/members', label: 'Members', icon: Users },
  { to: '/staff/fines', label: 'Fines', icon: IndianRupee },
  { to: '/staff/reports', label: 'Reports', icon: BarChart3 },
];

// Only routes that exist are listed.
export const NAV_BY_ROLE = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: Gauge, end: true },
    { to: '/student/books', label: 'My Books', icon: BookOpen },
    { to: '/student/requests', label: 'My Requests', icon: Send },
    { to: '/student/history', label: 'Borrowing History', icon: History },
    { to: '/student/fines', label: 'My Fines', icon: IndianRupee },
    ...common,
  ],
  LIBRARIAN: [{ to: '/librarian', label: 'Dashboard', icon: Gauge, end: true }, ...staffCore, ...common],
  ADMIN: [{ to: '/admin', label: 'Dashboard', icon: Gauge, end: true }, ...staffCore, ...common],
};
