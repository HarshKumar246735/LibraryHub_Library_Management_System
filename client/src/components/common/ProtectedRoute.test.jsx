import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const mockAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth() }));

const renderAt = (roles) =>
  render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/secret" element={<ProtectedRoute roles={roles}><p>Secret page</p></ProtectedRoute>} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/unauthorized" element={<p>Unauthorized page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is restored', () => {
    mockAuth.mockReturnValue({ user: null, loading: true });
    renderAt();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('redirects anonymous visitors to login', () => {
    mockAuth.mockReturnValue({ user: null, loading: false });
    renderAt();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
  it('redirects users with the wrong role', () => {
    mockAuth.mockReturnValue({ user: { role: 'STUDENT' }, loading: false });
    renderAt(['ADMIN']);
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
  });
  it('renders the page for an allowed role', () => {
    mockAuth.mockReturnValue({ user: { role: 'ADMIN' }, loading: false });
    renderAt(['ADMIN']);
    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});
