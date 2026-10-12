import { wholeDaysBetween } from './dates.js';

// Fine = chargeable overdue days x rate, where chargeable = max(0, daysLate - graceDays), capped by maxFine.
export function calculateFine({ dueDate, returnDate, ratePerDay, graceDays = 0, maxFine = null }) {
  const daysLate = Math.max(0, wholeDaysBetween(dueDate, returnDate));
  const chargeableDays = Math.max(0, daysLate - graceDays);
  let amount = chargeableDays * ratePerDay;
  if (maxFine !== null && maxFine !== undefined) amount = Math.min(amount, maxFine);
  return { daysLate, chargeableDays, amount };
}
