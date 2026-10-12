import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFine } from '../utils/fine.js';

const d = (s) => new Date(`${s}T00:00:00Z`);

test('spec example: due Oct 10, returned Oct 13, Rs 5/day => Rs 15', () => {
  const r = calculateFine({ dueDate: d('2026-10-10'), returnDate: d('2026-10-13'), ratePerDay: 5 });
  assert.deepEqual(r, { daysLate: 3, chargeableDays: 3, amount: 15 });
});
test('returning on or before the due date costs nothing and never goes negative', () => {
  assert.equal(calculateFine({ dueDate: d('2026-10-10'), returnDate: d('2026-10-10'), ratePerDay: 5 }).amount, 0);
  assert.equal(calculateFine({ dueDate: d('2026-10-10'), returnDate: d('2026-10-01'), ratePerDay: 5 }).amount, 0);
});
test('time of day on the return date does not change the result', () => {
  const r = calculateFine({ dueDate: d('2026-10-10'), returnDate: new Date('2026-10-11T23:59:59Z'), ratePerDay: 5 });
  assert.equal(r.daysLate, 1);
});
test('grace period reduces chargeable days', () => {
  const r = calculateFine({ dueDate: d('2026-10-10'), returnDate: d('2026-10-13'), ratePerDay: 5, graceDays: 2 });
  assert.deepEqual(r, { daysLate: 3, chargeableDays: 1, amount: 5 });
});
test('maximum fine caps the amount', () => {
  const r = calculateFine({ dueDate: d('2026-10-01'), returnDate: d('2026-11-01'), ratePerDay: 5, maxFine: 100 });
  assert.equal(r.amount, 100);
});
