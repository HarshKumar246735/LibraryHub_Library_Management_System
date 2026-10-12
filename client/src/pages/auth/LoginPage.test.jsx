import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const login = vi.fn();
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }));
vi.mock('../../components/common/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

const setup = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  it('shows validation messages and does not call the API for empty input', async () => {
    login.mockClear();
    setup();
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
  it('submits valid credentials', async () => {
    login.mockResolvedValue({ fullName: 'Asha Verma', role: 'STUDENT' });
    setup();
    await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rdTest');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'Passw0rdTest' }));
  });
});
