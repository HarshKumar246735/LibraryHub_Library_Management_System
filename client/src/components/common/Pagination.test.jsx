import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('marks the current page and disables Previous on page 1', () => {
    render(<Pagination page={1} totalPages={5} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });
  it('calls onChange with the next page number', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
