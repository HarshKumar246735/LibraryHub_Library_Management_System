import { BookIssue } from '../models/BookIssue.js';
import { addDays, startOfUtcDay } from '../utils/dates.js';
import { notify } from '../services/notificationService.js';

const DUE_SOON_DAYS = 2;
const day = (d) => d.toISOString().slice(0, 10);

// Safe to run any number of times: each notification has a dedupeKey with a unique index.
export async function runDueDateJob(now = new Date()) {
  const today = startOfUtcDay(now);
  const soonLimit = addDays(today, DUE_SOON_DAYS);
  const loans = await BookIssue.find({ status: 'issued', dueDate: { $lte: soonLimit } }).populate('book', 'title').lean();
  let created = 0;
  for (const loan of loans) {
    const title = loan.book?.title || 'a book';
    const overdue = loan.dueDate < today;
    const ok = overdue
      ? await notify(loan.student, 'BOOK_OVERDUE', 'Book overdue', `"${title}" was due on ${day(loan.dueDate)}. Late fines apply per day.`, `overdue:${loan._id}:${day(today)}`)
      : await notify(loan.student, 'DUE_SOON', 'Due date approaching', `"${title}" is due on ${day(loan.dueDate)}.`, `due-soon:${loan._id}:${day(loan.dueDate)}`);
    if (ok) created += 1;
  }
  return { checked: loans.length, created };
}
