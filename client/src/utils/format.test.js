import { describe, expect, it } from 'vitest';
import { daysUntil, formatCurrency, formatDate, isOverdue } from './format';

const dayFromNow = (n) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + n));
};

describe('format helpers', () => {
  it('formats dates in UTC so calendar dates never shift', () => {
    expect(formatDate('2026-10-10T00:00:00.000Z')).toBe('10 Oct 2026');
    expect(formatDate(null)).toBe('—');
  });
  it('formats rupees without decimals', () => {
    expect(formatCurrency(1500)).toBe('₹1,500');
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });
  it('treats a due date of today as not overdue and yesterday as overdue', () => {
    expect(isOverdue(dayFromNow(0))).toBe(false);
    expect(isOverdue(dayFromNow(-1))).toBe(true);
    expect(isOverdue(dayFromNow(3))).toBe(false);
  });
  it('counts whole days until a due date', () => {
    expect(daysUntil(dayFromNow(3))).toBe(3);
    expect(daysUntil(dayFromNow(0))).toBe(0);
  });
});
